// Web Push API implementation (no Firebase needed)

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI8TlbjwjBwkKgJag2F6Bt3_-7ZY5kXJlEGxjz38ZnOwRfJIm-f1I5TqKo';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  const registration = await registerServiceWorker();
  if (!registration) {
    console.error('Service Worker not available');
    return null;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.error('Notification permission not granted');
    return null;
  }

  try {
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    console.log('Push subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return true;

  try {
    const unsubscribed = await subscription.unsubscribe();
    console.log('Push unsubscription:', unsubscribed);
    return unsubscribed;
  } catch (error) {
    console.error('Push unsubscription failed:', error);
    return false;
  }
}

// Send subscription to server
export async function sendSubscriptionToServer(subscription: PushSubscription, userId: string): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3001/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription,
        userId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send subscription to server');
    }

    console.log('Subscription sent to server successfully');
    return true;
  } catch (error) {
    console.error('Failed to send subscription to server:', error);
    return false;
  }
}

// Test notification
export function showTestNotification(title: string, body: string): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon-32x32.png',
      badge: '/favicon-32x32.png',
      tag: 'test-notification'
    });
  }
}

// Initialize push notifications
export async function initializePushNotifications(userId: string): Promise<boolean> {
  try {
    console.log('Initializing push notifications for user:', userId);
    
    const subscription = await subscribeToPush();
    if (!subscription) {
      console.error('Failed to get push subscription');
      return false;
    }

    const serverResult = await sendSubscriptionToServer(subscription, userId);
    if (!serverResult) {
      console.error('Failed to register subscription with server');
      return false;
    }

    console.log('Push notifications initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
    return false;
  }
}