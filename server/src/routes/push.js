import express from 'express';
import { body, validationResult } from 'express-validator';
import { saveSubscription, notifyMoodUpdate, notifyMoodAcknowledgment } from '../lib/webPush.js';

const router = express.Router();

// Subscribe to push notifications
router.post('/subscribe', [
  body('subscription').isObject(),
  body('userId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subscription, userId } = req.body;

    const success = await saveSubscription(userId, subscription);
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Push subscription saved successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to save push subscription' 
      });
    }
  } catch (error) {
    console.error('Push subscription error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Test push notification
router.post('/test', [
  body('userId').isUUID(),
  body('message').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, message } = req.body;

    const count = await notifyMoodUpdate(
      userId, 
      'happy', 
      message || 'Test notification from sTEAtus'
    );

    res.json({ 
      success: true, 
      message: `Test notification sent to ${count} devices` 
    });
  } catch (error) {
    console.error('Test push error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send test notification' 
    });
  }
});

// Notify mood update (called internally or by webhooks)
router.post('/notify-mood', [
  body('userId').isUUID(),
  body('moodType').isString(),
  body('userName').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, moodType, userName } = req.body;

    const count = await notifyMoodUpdate(userId, moodType, userName);

    res.json({ 
      success: true, 
      message: `Mood update notification sent to ${count} contacts` 
    });
  } catch (error) {
    console.error('Notify mood error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to notify mood update' 
    });
  }
});

// Notify mood acknowledgment
router.post('/notify-acknowledgment', [
  body('userId').isUUID(),
  body('acknowledgerName').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, acknowledgerName } = req.body;

    const count = await notifyMoodAcknowledgment(userId, acknowledgerName);

    res.json({ 
      success: true, 
      message: `Acknowledgment notification sent to ${count} devices` 
    });
  } catch (error) {
    console.error('Notify acknowledgment error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to notify acknowledgment' 
    });
  }
});

export default router;