import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:test@example.com',
  process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI8TlbjwjBwkKgJag2F6Bt3_-7ZY5kXJlEGxjz38ZnOwRfJIm-f1I5TqKo',
  process.env.VAPID_PRIVATE_KEY || 'wlWsQKhDFH7rQqOoUKoiEWJKd3_EHHKC5gf2DKKZKCg'
);

export async function saveSubscription(userId, subscription) {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert([{
        user_id: userId,
        subscription: subscription
      }], {
        onConflict: 'user_id'
      });

    if (error) throw error;
    console.log('Push subscription saved for user:', userId);
    return true;
  } catch (error) {
    console.error('Failed to save push subscription:', error);
    return false;
  }
}

export async function getSubscriptionsForUser(userId) {
  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(row => row.subscription);
  } catch (error) {
    console.error('Failed to get push subscriptions:', error);
    return [];
  }
}

export async function getSubscriptionsForContacts(userId) {
  try {
    // Get all contacts for the user
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('contact_user_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (contactsError) throw contactsError;

    const contactIds = contacts.map(c => c.contact_user_id);
    if (contactIds.length === 0) return [];

    // Get subscriptions for all contacts
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription')
      .in('user_id', contactIds);

    if (subsError) throw subsError;

    return subscriptions;
  } catch (error) {
    console.error('Failed to get contact subscriptions:', error);
    return [];
  }
}

export async function sendPushNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('Push notification sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    
    // If subscription is no longer valid, remove it
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('Subscription no longer valid, should remove from database');
      // TODO: Remove invalid subscription from database
    }
    
    return false;
  }
}

export async function notifyMoodUpdate(userId, moodType, userName) {
  try {
    const subscriptions = await getSubscriptionsForContacts(userId);
    
    const payload = {
      title: `${userName || 'Your friend'} updated their mood`,
      body: `They're feeling ${moodType}`,
      icon: '/favicon-32x32.png',
      badge: '/favicon-32x32.png',
      tag: 'mood-update',
      data: {
        userId: userId,
        moodType: moodType,
        url: '/'
      }
    };

    const promises = subscriptions.map(sub => 
      sendPushNotification(sub.subscription, payload)
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    console.log(`Mood update notifications sent: ${successful}/${subscriptions.length}`);
    return successful;
  } catch (error) {
    console.error('Failed to notify mood update:', error);
    return 0;
  }
}

export async function notifyMoodAcknowledgment(userId, acknowledgerName) {
  try {
    const subscriptions = await getSubscriptionsForUser(userId);
    
    const payload = {
      title: 'Someone saw your mood',
      body: `${acknowledgerName || 'A friend'} acknowledged how you're feeling`,
      icon: '/favicon-32x32.png',
      badge: '/favicon-32x32.png',
      tag: 'mood-acknowledgment',
      data: {
        type: 'acknowledgment',
        url: '/'
      }
    };

    const promises = subscriptions.map(sub => 
      sendPushNotification(sub, payload)
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    console.log(`Acknowledgment notifications sent: ${successful}/${subscriptions.length}`);
    return successful;
  } catch (error) {
    console.error('Failed to notify mood acknowledgment:', error);
    return 0;
  }
}