import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { moods, type MoodId } from '@/lib/utils'

interface MoodSelectorProps {
  onMoodSelect: (moodId: MoodId) => void
  currentMood?: MoodId
}

export function MoodSelector({ onMoodSelect, currentMood }: MoodSelectorProps) {
  const colors = ['bg-soft-purple', 'bg-soft-yellow', 'bg-soft-red', 'bg-soft-blue', 'bg-soft-green', 'bg-soft-pink', 'bg-red-500', 'bg-red-600']
  
  return (
    <Card className="doodle-card float-animation">
      <CardHeader className="text-center">
        <CardTitle className="handwritten text-xl color-soft-purple">How are you feeling?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {moods.map((mood, index) => (
            <Button
              key={mood.id}
              variant="mood"
              size="mood"
              onClick={() => onMoodSelect(mood.id)}
              className={`doodle-button flex flex-col items-center space-y-2 text-gray-700 ${colors[index % colors.length]} ${
                currentMood === mood.id 
                  ? 'ring-4 ring-purple-300 scale-105 shadow-lg' 
                  : 'hover:scale-105'
              } ${mood.id === 'shutdown' || mood.id === 'meltdown' ? 'text-white' : ''}`}
            >
              <span className="mood-emoji text-3xl">{mood.emoji}</span>
              <span className="handwritten text-sm font-semibold">{mood.name}</span>
            </Button>
          ))}
        </div>
        {currentMood && (
          <div className="text-center mt-4 p-3 bg-white rounded-lg border-2 border-dashed border-gray-200 sketchy-border">
            <p className="text-sm text-gray-600 handwritten">
              {moods.find(m => m.id === currentMood)?.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}