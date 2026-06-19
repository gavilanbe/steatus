import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Camera, Edit3, Save, X, User, Heart, Calendar } from 'lucide-react'
import { moods } from '@/lib/utils'
import { useAuth } from '../../contexts/SupabaseAuthContext'
import { useSupabaseMoods } from '../../hooks/useSupabaseMoods'
import { useSupabaseContacts } from '../../hooks/useSupabaseContacts'
import { supabase } from '../../lib/supabase'
import { exportMoodDataToCSV, exportMoodDataToPDF, type ExportData } from '../../lib/exportUtils'

export function Profile() {
  const [isEditing, setIsEditing] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { user, profile: userProfile, updateProfile, uploadProfilePicture } = useAuth()
  const { moodHistory } = useSupabaseMoods()
  const { contacts } = useSupabaseContacts()
  
  const [editData, setEditData] = useState({
    display_name: userProfile?.display_name || '',
    bio: userProfile?.bio || '',
    avatar_emoji: userProfile?.avatar_emoji || '😊'
  })

  useEffect(() => {
    if (userProfile) {
      setEditData({
        display_name: userProfile.display_name || '',
        bio: userProfile.bio || '',
        avatar_emoji: userProfile.avatar_emoji || '😊'
      })
    }
  }, [userProfile])

  const handleSave = async () => {
    try {
      await updateProfile(editData)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleCancel = () => {
    if (userProfile) {
      setEditData({
        display_name: userProfile.display_name || '',
        bio: userProfile.bio || '',
        avatar_emoji: userProfile.avatar_emoji || '😊'
      })
    }
    setIsEditing(false)
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    try {
      setIsUploadingAvatar(true)
      await uploadProfilePicture(file)
    } catch (error) {
      console.error('Avatar upload failed:', error)
      alert('Failed to upload avatar. Please try again.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Calculate most used mood from real data
  const getMostUsedMood = () => {
    if (moodHistory.length === 0) return null
    
    const moodCounts: Record<string, number> = {}
    moodHistory.forEach(mood => {
      moodCounts[mood.mood_type] = (moodCounts[mood.mood_type] || 0) + 1
    })
    
    const mostUsed = Object.entries(moodCounts).reduce((a, b) => 
      moodCounts[a[0]] > moodCounts[b[0]] ? a : b
    )
    
    return {
      type: mostUsed[0],
      count: mostUsed[1],
      percentage: Math.round((mostUsed[1] / moodHistory.length) * 100)
    }
  }

  const mostUsedMood = getMostUsedMood()
  const mostUsedMoodData = mostUsedMood ? moods.find(m => m.id === mostUsedMood.type) : null

  const stats = [
    { label: 'Mood Updates', value: moodHistory.length, icon: Heart },
    { label: 'Support Network', value: contacts.length, icon: User },
    { label: 'Days Active', value: userProfile?.created_at ? Math.floor((Date.now() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0, icon: Calendar }
  ]

  return (
    <div className="space-y-4 pb-6">
      {/* Profile Header */}
      <Card className="doodle-card">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-amber-200 rounded-full flex items-center justify-center text-4xl border-4 border-amber-300 overflow-hidden">
                {userProfile?.avatar_url ? (
                  <img 
                    src={userProfile.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : isEditing ? (
                  <select
                    value={editData.avatar_emoji}
                    onChange={(e) => setEditData(prev => ({ ...prev, avatar_emoji: e.target.value }))}
                    className="w-20 h-20 bg-transparent text-center text-3xl border-none outline-none cursor-pointer"
                  >
                    <option value="😊">😊</option>
                    <option value="🤗">🤗</option>
                    <option value="😌">😌</option>
                    <option value="🙂">🙂</option>
                    <option value="😄">😄</option>
                    <option value="😇">😇</option>
                  </select>
                ) : (
                  userProfile?.avatar_emoji || '😊'
                )}
              </div>
              
              {/* Camera button with file input */}
              <div className="absolute -bottom-1 -right-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 bg-amber-300 hover:bg-amber-400 rounded-full"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Name */}
            <div className="text-center">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.display_name}
                  onChange={(e) => setEditData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Your display name"
                  className="text-xl font-bold text-amber-900 text-center bg-transparent border-b-2 border-amber-300 focus:border-amber-500 outline-none"
                />
              ) : (
                <h2 className="text-xl font-bold text-amber-900">
                  {userProfile?.display_name || userProfile?.username || 'Anonymous User'}
                </h2>
              )}
              <p className="text-sm text-amber-600">
                Member since {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Recently'}
              </p>
            </div>

            {/* Bio */}
            <div className="w-full">
              {isEditing ? (
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full p-3 text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-lg resize-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              ) : (
                <p className="text-center text-amber-700 bg-amber-50 p-3 rounded-lg">
                  {userProfile?.bio || 'No bio added yet. Click edit to add one!'}
                </p>
              )}
            </div>

            {/* Edit Buttons */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="doodle-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-800">Your Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <Icon className="w-6 h-6 mx-auto text-amber-600 mb-2" />
                  <p className="text-xl font-bold text-amber-900">{stat.value}</p>
                  <p className="text-xs text-amber-700">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Most Used Mood */}
      <Card className="doodle-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-800">Your Favorite Mood</CardTitle>
        </CardHeader>
        <CardContent>
          {mostUsedMoodData && mostUsedMood ? (
            <div className="flex items-center justify-center space-x-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <span className="text-4xl">{mostUsedMoodData.emoji}</span>
              <div>
                <h3 className="text-xl font-bold text-amber-900 capitalize">{mostUsedMoodData.name}</h3>
                <p className="text-sm text-amber-700">{mostUsedMoodData.description}</p>
                <p className="text-xs text-amber-600 mt-1">Used {mostUsedMood.percentage}% of the time ({mostUsedMood.count} times)</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-amber-600">No mood data yet</p>
              <p className="text-sm text-amber-500">Start sharing your moods to see your patterns!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="doodle-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Heart className="w-4 h-4 mr-2" />
            Share Profile with Friend
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Calendar className="w-4 h-4 mr-2" />
            Export Mood Data
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <User className="w-4 h-4 mr-2" />
            Privacy Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}