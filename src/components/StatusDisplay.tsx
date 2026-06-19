import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Heart, Users, Clock } from 'lucide-react'
import { moods, type MoodId } from '@/lib/utils'

interface StatusDisplayProps {
  currentMood?: MoodId
  acknowledgeCount: number
  lastUpdated?: Date
  isVisible: boolean
  onToggleVisibility: () => void
}

export function StatusDisplay({ 
  currentMood, 
  acknowledgeCount, 
  lastUpdated, 
  isVisible,
  onToggleVisibility 
}: StatusDisplayProps) {
  const mood = currentMood ? moods.find(m => m.id === currentMood) : null

  return (
    <Card className="doodle-card float-animation">
      <CardHeader className="text-center">
        <CardTitle className="handwritten text-xl color-soft-pink flex items-center justify-center gap-2">
          <Users className="w-5 h-5" />
          Your Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mood ? (
          <div className="text-center space-y-3">
            <div className="flex flex-col items-center space-y-2">
              <span className="mood-emoji text-6xl">{mood.emoji}</span>
              <h3 className="handwritten text-2xl text-gray-700">{mood.name}</h3>
              <p className="text-gray-600 text-sm">{mood.description}</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-200 sketchy-border">
              <div className="flex items-center justify-center gap-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 color-soft-red" />
                  <span className="text-sm font-semibold handwritten">{acknowledgeCount} acks</span>
                </div>
                {lastUpdated && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 color-soft-blue" />
                    <span className="text-xs handwritten">
                      {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant={isVisible ? "destructive" : "secondary"}
              size="sm"
              onClick={onToggleVisibility}
              className={`doodle-button w-full handwritten ${isVisible ? 'color-soft-red' : 'color-soft-green'}`}
            >
              {isVisible ? "Hide Status" : "Show Status"}
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-6xl mb-4 block mood-emoji">🤔</span>
            <p className="text-gray-600 handwritten">Select your mood to share with your support network</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}