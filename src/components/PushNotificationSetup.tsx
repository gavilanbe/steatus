import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { 
  initializePushNotifications, 
  requestNotificationPermission, 
  showTestNotification,
  unsubscribeFromPush 
} from '../lib/pushNotifications';

export function PushNotificationSetup() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const success = await initializePushNotifications(user.id);
      if (success) {
        setIsSubscribed(true);
        setPermission('granted');
        showTestNotification('sTEAtus Notifications Enabled', 'You\'ll now receive mood updates from friends!');
      } else {
        alert('Failed to enable push notifications. Please try again.');
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      alert('Failed to enable push notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
      } else {
        alert('Failed to disable push notifications. Please try again.');
      }
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      alert('Failed to disable push notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = () => {
    showTestNotification('Test Notification', 'This is how mood updates will look!');
  };

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return (
      <Card className="doodle-card">
        <CardHeader>
          <CardTitle className="handwritten text-lg color-soft-red flex items-center gap-2">
            <BellOff className="w-5 h-5" />
            Push Notifications Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 handwritten">
            Your browser doesn't support push notifications. You can still use the app, but won't receive notifications when friends update their moods.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="doodle-card">
      <CardHeader>
        <CardTitle className="handwritten text-lg color-soft-purple flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 handwritten">
          Get notified when friends update their moods, especially for Shutdown and Meltdown states.
        </p>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div>
            <p className="handwritten font-semibold text-gray-700">Status:</p>
            <p className="text-sm text-gray-600 handwritten">
              {permission === 'granted' ? (isSubscribed ? 'Enabled' : 'Permission granted') 
               : permission === 'denied' ? 'Blocked' 
               : 'Not enabled'}
            </p>
          </div>
          <div className="flex items-center">
            {permission === 'granted' && isSubscribed ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : permission === 'denied' ? (
              <X className="w-5 h-5 text-red-500" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {permission !== 'granted' || !isSubscribed ? (
            <Button
              onClick={handleEnableNotifications}
              disabled={isLoading || permission === 'denied'}
              className="doodle-button bg-soft-purple text-white flex-1"
            >
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleTestNotification}
                variant="outline"
                className="doodle-button flex-1"
              >
                Test Notification
              </Button>
              <Button
                onClick={handleDisableNotifications}
                disabled={isLoading}
                variant="outline"
                className="doodle-button text-red-600"
              >
                {isLoading ? 'Disabling...' : 'Disable'}
              </Button>
            </>
          )}
        </div>

        {permission === 'denied' && (
          <div className="p-3 bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-lg">
            <p className="text-sm text-yellow-700 handwritten">
              <strong>Notifications are blocked.</strong> To enable them:
            </p>
            <ol className="text-xs text-yellow-600 handwritten mt-2 space-y-1">
              <li>1. Click the lock icon in your address bar</li>
              <li>2. Set "Notifications" to "Allow"</li>
              <li>3. Refresh this page</li>
            </ol>
          </div>
        )}

        <div className="text-xs text-gray-500 handwritten">
          💡 iPhone users: Add this app to your home screen for the best notification experience!
        </div>
      </CardContent>
    </Card>
  );
}