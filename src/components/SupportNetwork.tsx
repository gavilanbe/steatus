import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { UserPlus, Heart, Bell } from 'lucide-react'
import { moods, type MoodId } from '@/lib/utils'

interface Contact {
  id: string
  name: string
  hasAcknowledged: boolean
  lastSeen?: Date
}

interface NetworkMember {
  id: string
  name: string
  currentMood?: MoodId
  lastUpdated?: Date
  isOnline: boolean
}

interface SupportNetworkProps {
  contacts: Contact[]
  networkMembers: NetworkMember[]
  onAddContact: () => void
  onAcknowledge: (contactId: string) => void
}

export function SupportNetwork({ 
  contacts, 
  networkMembers, 
  onAddContact, 
  onAcknowledge 
}: SupportNetworkProps) {
  return (
    <div className="space-y-4">
      <Card className="doodle-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Your Support Network
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddContact}
              className="text-amber-700 hover:text-amber-900"
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {networkMembers.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-4xl mb-2 block">👥</span>
              <p className="text-amber-700 text-sm">No network members yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddContact}
                className="mt-3"
              >
                Add First Contact
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {networkMembers.map((member) => {
                const mood = member.currentMood ? moods.find(m => m.id === member.currentMood) : null
                const contact = contacts.find(c => c.id === member.id)
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {mood ? (
                          <span className="text-2xl">{mood.emoji}</span>
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-500">?</span>
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
                          member.isOnline ? 'bg-green-400' : 'bg-gray-300'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-900">{member.name}</h4>
                        <p className="text-xs text-amber-600">
                          {mood ? `${mood.name}` : 'No status'}
                          {member.lastUpdated && (
                            <span className="ml-2">
                              • {member.lastUpdated.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {mood && contact && !contact.hasAcknowledged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAcknowledge(member.id)}
                        className="text-amber-700 hover:text-red-500"
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="doodle-card">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-amber-800 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm">
              <span className="text-amber-700">Push notifications</span>
              <input type="checkbox" className="rounded" defaultChecked />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span className="text-amber-700">Sound alerts</span>
              <input type="checkbox" className="rounded" />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span className="text-amber-700">Quiet hours (9PM - 8AM)</span>
              <input type="checkbox" className="rounded" defaultChecked />
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}