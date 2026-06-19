import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Send friend request
router.post('/request', [
  body('username').isLength({ min: 3, max: 20 }).isAlphanumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username } = req.body;
    const userId = req.user.id;

    // Find the user to add
    const userResult = await query('SELECT id FROM users WHERE username = $1', [username]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const contactUserId = userResult.rows[0].id;

    if (contactUserId === userId) {
      return res.status(400).json({ error: 'Cannot add yourself as a contact' });
    }

    // Check if relationship already exists
    const existingResult = await query(
      'SELECT status FROM contacts WHERE (user_id = $1 AND contact_user_id = $2) OR (user_id = $2 AND contact_user_id = $1)',
      [userId, contactUserId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'Contact relationship already exists' });
    }

    // Create pending request
    await query(
      'INSERT INTO contacts (user_id, contact_user_id, status) VALUES ($1, $2, \'pending\')',
      [userId, contactUserId]
    );

    res.status(201).json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept/reject friend request
router.put('/request/:requestId', [
  body('action').isIn(['accept', 'reject'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId } = req.params;
    const { action } = req.body;
    const userId = req.user.id;

    // Verify the request exists and is for this user
    const requestResult = await query(
      'SELECT user_id, contact_user_id FROM contacts WHERE id = $1 AND contact_user_id = $2 AND status = \'pending\'',
      [requestId, userId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    const { user_id: requesterId, contact_user_id: recipientId } = requestResult.rows[0];

    if (action === 'accept') {
      // Update original request
      await query('UPDATE contacts SET status = \'accepted\' WHERE id = $1', [requestId]);
      
      // Create reciprocal relationship
      await query(
        'INSERT INTO contacts (user_id, contact_user_id, status) VALUES ($1, $2, \'accepted\')',
        [recipientId, requesterId]
      );
    } else {
      // Delete the request
      await query('DELETE FROM contacts WHERE id = $1', [requestId]);
    }

    res.json({ message: `Friend request ${action}ed` });
  } catch (error) {
    console.error('Handle friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get contacts list
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT 
        c.id,
        c.status,
        u.id as user_id,
        u.username,
        u.display_name,
        u.avatar_url,
        m.mood_type as current_mood,
        m.created_at as mood_updated_at,
        m.is_visible as mood_visible
      FROM contacts c
      JOIN users u ON c.contact_user_id = u.id
      LEFT JOIN LATERAL (
        SELECT mood_type, created_at, is_visible
        FROM moods 
        WHERE user_id = u.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) m ON true
      WHERE c.user_id = $1 AND c.status = 'accepted'
      ORDER BY u.display_name
    `, [userId]);

    res.json({
      contacts: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        currentMood: row.current_mood,
        moodUpdatedAt: row.mood_updated_at,
        moodVisible: row.mood_visible,
        isOnline: false // TODO: Implement online status with socket.io
      }))
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending friend requests
router.get('/requests', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT 
        c.id,
        u.username,
        u.display_name,
        u.avatar_url,
        c.created_at
      FROM contacts c
      JOIN users u ON c.user_id = u.id
      WHERE c.contact_user_id = $1 AND c.status = 'pending'
      ORDER BY c.created_at DESC
    `, [userId]);

    res.json({
      requests: result.rows.map(row => ({
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove contact
router.delete('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user.id;

    // Get the contact relationship
    const contactResult = await query(
      'SELECT contact_user_id FROM contacts WHERE id = $1 AND user_id = $2',
      [contactId, userId]
    );

    if (contactResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const contactUserId = contactResult.rows[0].contact_user_id;

    // Delete both directions of the relationship
    await query(
      'DELETE FROM contacts WHERE (user_id = $1 AND contact_user_id = $2) OR (user_id = $2 AND contact_user_id = $1)',
      [userId, contactUserId]
    );

    res.json({ message: 'Contact removed' });
  } catch (error) {
    console.error('Remove contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;