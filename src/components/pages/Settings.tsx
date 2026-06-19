import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Bell, Shield, Palette, Volume2, Moon, Smartphone } from 'lucide-react'
import { PushNotificationSetup } from '../PushNotificationSetup'
import { useSupabaseSettings } from '../../hooks/useSupabaseSettings'
import { useTheme } from '../../contexts/ThemeContext'

export function Settings() {
  const { settings, isLoading, updateSettings, toggleSetting } = useSupabaseSettings()
  const { setColorScheme, setFontSize } = useTheme()

  if (!settings) {
    return (
      <div className="space-y-4 pb-6">
        <div className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-amber-300 border-t-amber-600 rounded-full mx-auto mb-2"></div>
          <p className="text-amber-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Notifications */}
      <Card className="doodle-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-800 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-900">Push Notifications</p>
              <p className="text-sm text-amber-700">Get notified when friends update their mood</p>
            </div>
            <input
              type="checkbox"
              checked={settings.push_enabled}
              onChange={() => toggleSetting('push_enabled')}
              className="w-5 h-5 rounded text-amber-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-900">Sound Alerts</p>
              <p className="text-sm text-amber-700">Play sound for notifications</p>
            </div>
            <input
              type="checkbox"
              checked={settings.sound_enabled}
              onChange={() => toggleSetting('sound_enabled')}
              className="w-5 h-5 rounded text-amber-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-900">Quiet Hours</p>
              <p className="text-sm text-amber-700">9 PM - 8 AM</p>
            </div>
            <input
              type="checkbox"
              checked={settings.quiet_hours}
              onChange={() => toggleSetting('quiet_hours')}
              className="w-5 h-5 rounded text-amber-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-900">Mood Updates</p>
              <p className="text-sm text-amber-700">When friends change their status</p>
            </div>
            <input
              type="checkbox"
              checked={settings.mood_updates}
              onChange={() => toggleSetting('mood_updates')}
              className="w-5 h-5 rounded text-amber-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-900">Acknowledgments</p>
              <p className="text-sm text-amber-700">When someone acks your status</p>
            </div>
            <input
              type="checkbox"
              checked={settings.acknowledgments}
              onChange={() => toggleSetting('acknowledgments')}
              className="w-5 h-5 rounded text-amber-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="doodle-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-800 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-900">Show Status to All Friends</p>
              <p className="text-sm text-amber-700">Your mood is visible to all contacts</p>
            </div>
            <input
              type="checkbox"
              checked={settings.show_to_all}
              onChange={() => toggleSetting('show_to_all')}
              className="w-5 h-5 rounded text-amber-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-900">Allow Friend Requests</p>
              <p className="text-sm text-amber-700">Others can send you friend requests</p>
            </div>
            <input
              type="checkbox"
              checked={settings.allow_friend_requests}
              onChange={() => toggleSetting('allow_friend_requests')}
              className="w-5 h-5 rounded text-amber-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-900">Share Mood History</p>
              <p className="text-sm text-amber-700">Allow friends to see your past moods</p>
            </div>
            <input
              type="checkbox"
              checked={settings.share_history}
              onChange={() => toggleSetting('share_history')}
              className="w-5 h-5 rounded text-amber-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="doodle-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-800 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-900">Dark Mode</p>
              <p className="text-sm text-amber-700">Use dark theme</p>
            </div>
            <input
              type="checkbox"
              checked={settings.dark_mode}
              onChange={() => toggleSetting('dark_mode')}
              className="w-5 h-5 rounded text-amber-600"
            />
          </div>

          <div>
            <p className="font-medium text-amber-900 mb-2">Color Scheme</p>
            <div className="flex gap-2">
              {(['warm', 'cool', 'neutral'] as const).map((scheme) => (
                <Button
                  key={scheme}
                  variant={settings.color_scheme === scheme ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    updateSettings({ color_scheme: scheme })
                    setColorScheme(scheme)
                  }}
                  className="capitalize"
                >
                  {scheme}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-medium text-amber-900 mb-2">Font Size</p>
            <div className="flex gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <Button
                  key={size}
                  variant={settings.font_size === size ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    updateSettings({ font_size: size })
                    setFontSize(size)
                  }}
                  className="capitalize"
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <PushNotificationSetup />

      {/* App Info */}
      <Card className="doodle-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-800 flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            App Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-amber-700">Version</span>
            <span className="text-amber-900 font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-700">Build</span>
            <span className="text-amber-900 font-medium">2024.1</span>
          </div>
          <Button variant="outline" className="w-full mt-4">
            Check for Updates
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}