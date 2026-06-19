import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Calendar, Clock, TrendingUp, BarChart3, Filter, Download } from 'lucide-react'
import { moods, type MoodId } from '@/lib/utils'
import { useSupabaseMoods } from '../../hooks/useSupabaseMoods'
import { useAuth } from '../../contexts/SupabaseAuthContext'
import { exportMoodDataToCSV, exportMoodDataToPDF, generateMoodInsights } from '../../lib/exportUtils'

export function History() {
  const [viewMode, setViewMode] = useState<'timeline' | 'chart'>('timeline')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')
  const [isExporting, setIsExporting] = useState(false)
  
  const { user, profile } = useAuth()
  const { moodHistory, isLoading } = useSupabaseMoods()

  // Filter moods based on time range
  const filteredMoodHistory = useMemo(() => {
    if (timeRange === 'all') return moodHistory
    
    const now = new Date()
    const cutoffDate = new Date()
    
    if (timeRange === 'week') {
      cutoffDate.setDate(now.getDate() - 7)
    } else if (timeRange === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1)
    }
    
    return moodHistory.filter(mood => new Date(mood.created_at) >= cutoffDate)
  }, [moodHistory, timeRange])

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getMoodStats = () => {
    if (filteredMoodHistory.length === 0) return []
    
    const stats: Record<string, number> = {}
    
    filteredMoodHistory.forEach(entry => {
      const moodType = entry.mood_type
      stats[moodType] = (stats[moodType] || 0) + 1
    })

    return Object.entries(stats)
      .map(([mood, count]) => ({
        mood: mood as MoodId,
        count,
        percentage: Math.round((count / filteredMoodHistory.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
  }

  const stats = getMoodStats()
  const insights = useMemo(() => generateMoodInsights(filteredMoodHistory), [filteredMoodHistory])

  const handleExportCSV = async () => {
    if (!user || !profile) return
    
    setIsExporting(true)
    try {
      const exportData = {
        user: {
          username: profile.username,
          displayName: profile.display_name,
          id: user.id
        },
        moodHistory: filteredMoodHistory,
        dateRange: {
          start: timeRange === 'all' 
            ? new Date(filteredMoodHistory[filteredMoodHistory.length - 1]?.created_at || Date.now())
            : timeRange === 'week' 
              ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      }
      
      exportMoodDataToCSV(exportData)
    } catch (error) {
      console.error('CSV export failed:', error)
      alert('Failed to export CSV. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    if (!user || !profile) return
    
    setIsExporting(true)
    try {
      const exportData = {
        user: {
          username: profile.username,
          displayName: profile.display_name,
          id: user.id
        },
        moodHistory: filteredMoodHistory,
        dateRange: {
          start: timeRange === 'all' 
            ? new Date(filteredMoodHistory[filteredMoodHistory.length - 1]?.created_at || Date.now())
            : timeRange === 'week' 
              ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      }
      
      await exportMoodDataToPDF(exportData)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Controls */}
      <Card className="doodle-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                className="flex-1"
              >
                <Clock className="w-4 h-4 mr-1" />
                Timeline
              </Button>
              <Button
                variant={viewMode === 'chart' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('chart')}
                className="flex-1"
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Stats
              </Button>
            </div>

            {/* Time Range */}
            <div className="flex gap-2">
              {['week', 'month', 'all'].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range as any)}
                  className="flex-1 capitalize"
                >
                  {range === 'all' ? 'All Time' : `This ${range}`}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <Card className="doodle-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-amber-800 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Mood Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-amber-300 border-t-amber-600 rounded-full mx-auto mb-2"></div>
                <p className="text-amber-600">Loading mood history...</p>
              </div>
            ) : filteredMoodHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto text-amber-300 mb-2" />
                <p className="text-amber-700">No mood history found</p>
                <p className="text-sm text-amber-600">Start sharing your moods to see them here!</p>
              </div>
            ) : (
              filteredMoodHistory.map((entry) => {
                const mood = moods.find(m => m.id === entry.mood_type)!
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-2xl mb-1">{mood.emoji}</span>
                      <div className="w-px h-6 bg-amber-300"></div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-amber-900 capitalize">{mood.name}</h4>
                        <span className="text-xs text-amber-600">{formatTime(new Date(entry.created_at))}</span>
                      </div>
                      
                      <p className="text-xs text-amber-600 mt-1">
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats View */}
      {viewMode === 'chart' && (
        <div className="space-y-4">
          <Card className="doodle-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-amber-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Mood Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 mx-auto text-amber-300 mb-2" />
                  <p className="text-amber-700">No mood data to display</p>
                  <p className="text-sm text-amber-600">Create some mood entries to see your patterns!</p>
                </div>
              ) : (
                stats.map((stat) => {
                  const mood = moods.find(m => m.id === stat.mood)!
                  return (
                  <div key={stat.mood} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{mood.emoji}</span>
                        <span className="font-medium text-amber-900 capitalize">{mood.name}</span>
                      </div>
                      <span className="text-sm text-amber-700">{stat.count} times ({stat.percentage}%)</span>
                    </div>
                    <div className="w-full bg-amber-100 rounded-full h-2">
                      <div
                        className="bg-amber-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                  </div>
                )
                })
              )}
            </CardContent>
          </Card>

          <Card className="doodle-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-amber-800">Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.totalEntries === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    No mood data available for insights. Start tracking your moods to see patterns!
                  </p>
                </div>
              ) : (
                <>
                  {insights.positiveRatio > 60 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Positive trend:</strong> You've been in positive moods {insights.positiveRatio}% of the time!
                      </p>
                    </div>
                  )}
                  
                  {insights.mostCommonMood && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Most frequent mood:</strong> {insights.mostCommonMood.name} appears {insights.mostCommonMood.percentage}% of the time ({insights.mostCommonMood.count} entries).
                      </p>
                    </div>
                  )}
                  
                  {insights.moodStreak && insights.moodStreak.count > 2 && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-800">
                        <strong>Current streak:</strong> You've been feeling {insights.moodStreak.current.toLowerCase()} for your last {insights.moodStreak.count} mood entries.
                      </p>
                    </div>
                  )}
                  
                  {insights.weeklyAverage > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>Tracking consistency:</strong> You log about {insights.weeklyAverage} mood entries per week on average.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Options */}
      <Card className="doodle-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-800">Export Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleExportPDF}
              disabled={isExporting || filteredMoodHistory.length === 0}
            >
              <Download className="w-4 h-4 mr-1" />
              {isExporting ? 'Generating...' : 'PDF Report'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleExportCSV}
              disabled={isExporting || filteredMoodHistory.length === 0}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              {isExporting ? 'Exporting...' : 'CSV Data'}
            </Button>
          </div>
          <p className="text-xs text-amber-600">
            Export your mood data for {timeRange === 'all' ? 'all time' : timeRange === 'week' ? 'this week' : 'this month'}. 
            {filteredMoodHistory.length === 0 && ' No data available for selected time range.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}