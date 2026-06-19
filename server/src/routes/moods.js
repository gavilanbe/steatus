import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

const VALID_MOODS = ['calm', 'happy', 'anxious', 'overwhelmed', 'focused', 'tired', 'shutdown', 'meltdown'];

// Create mood update
router.post('/', [
  body('moodType').isIn(VALID_MOODS),
  body('isVisible').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { moodType, isVisible = true } = req.body;
    const userId = req.user.id;

    const result = await query(
      'INSERT INTO moods (user_id, mood_type, is_visible) VALUES ($1, $2, $3) RETURNING *',
      [userId, moodType, isVisible]
    );

    const mood = result.rows[0];

    // Get contacts to notify
    const contactsResult = await query(`
      SELECT c.contact_user_id, u.username, u.display_name 
      FROM contacts c 
      JOIN users u ON c.contact_user_id = u.id 
      WHERE c.user_id = $1 AND c.status = 'accepted'
    `, [userId]);

    res.status(201).json({
      mood: {
        id: mood.id,
        moodType: mood.mood_type,
        isVisible: mood.is_visible,
        createdAt: mood.created_at
      },
      notifyContacts: contactsResult.rows
    });
  } catch (error) {
    console.error('Create mood error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user's mood history
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await query(`
      SELECT id, mood_type, is_visible, created_at,
        (SELECT COUNT(*) FROM mood_acknowledgments WHERE mood_id = moods.id) as acknowledgment_count
      FROM moods 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    res.json({
      moods: result.rows.map(mood => ({
        id: mood.id,
        moodType: mood.mood_type,
        isVisible: mood.is_visible,
        acknowledgmentCount: parseInt(mood.acknowledgment_count),
        createdAt: mood.created_at
      }))
    });
  } catch (error) {
    console.error('Get mood history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current mood
router.get('/current', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT id, mood_type, is_visible, created_at,
        (SELECT COUNT(*) FROM mood_acknowledgments WHERE mood_id = moods.id) as acknowledgment_count
      FROM moods 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.json({ mood: null });
    }

    const mood = result.rows[0];

    res.json({
      mood: {
        id: mood.id,
        moodType: mood.mood_type,
        isVisible: mood.is_visible,
        acknowledgmentCount: parseInt(mood.acknowledgment_count),
        createdAt: mood.created_at
      }
    });
  } catch (error) {
    console.error('Get current mood error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Acknowledge a mood
router.post('/:moodId/acknowledge', async (req, res) => {
  try {
    const { moodId } = req.params;
    const acknowledgedBy = req.user.id;

    // Check if mood exists and get the mood owner
    const moodResult = await query('SELECT user_id FROM moods WHERE id = $1', [moodId]);
    
    if (moodResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mood not found' });
    }

    const moodUserId = moodResult.rows[0].user_id;

    // Check if acknowledger is a contact of the mood owner
    const contactResult = await query(
      'SELECT id FROM contacts WHERE user_id = $1 AND contact_user_id = $2 AND status = \'accepted\'',
      [moodUserId, acknowledgedBy]
    );

    if (contactResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to acknowledge this mood' });
    }

    // Insert acknowledgment (will ignore if already exists due to UNIQUE constraint)
    try {
      await query(
        'INSERT INTO mood_acknowledgments (mood_id, acknowledged_by) VALUES ($1, $2)',
        [moodId, acknowledgedBy]
      );
    } catch (err) {
      if (err.code === '23505') { // Unique constraint violation
        return res.status(409).json({ error: 'Already acknowledged' });
      }
      throw err;
    }

    // Get updated acknowledgment count
    const countResult = await query(
      'SELECT COUNT(*) as count FROM mood_acknowledgments WHERE mood_id = $1',
      [moodId]
    );

    res.json({
      success: true,
      acknowledgmentCount: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Acknowledge mood error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;