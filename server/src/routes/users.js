import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT 
        id, email, username, display_name, avatar_url, created_at,
        (SELECT COUNT(*) FROM contacts WHERE user_id = $1 AND status = 'accepted') as contact_count,
        (SELECT COUNT(*) FROM contacts WHERE contact_user_id = $1 AND status = 'pending') as pending_requests
      FROM users 
      WHERE id = $1
    `, [userId]);

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        contactCount: parseInt(user.contact_count),
        pendingRequests: parseInt(user.pending_requests)
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/me', [
  body('displayName').optional().isLength({ max: 100 }),
  body('avatarUrl').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { displayName, avatarUrl } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (displayName !== undefined) {
      updates.push(`display_name = $${paramCount++}`);
      values.push(displayName);
    }

    if (avatarUrl !== undefined) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(avatarUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, username, display_name, avatar_url`,
      values
    );

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const result = await query(`
      SELECT 
        u.id, u.username, u.display_name, u.avatar_url,
        CASE 
          WHEN c.status IS NOT NULL THEN c.status
          ELSE 'none'
        END as relationship_status
      FROM users u
      LEFT JOIN contacts c ON (c.user_id = $1 AND c.contact_user_id = u.id) 
        OR (c.user_id = u.id AND c.contact_user_id = $1)
      WHERE u.id != $1 
        AND (u.username ILIKE $2 OR u.display_name ILIKE $2)
      ORDER BY u.display_name
      LIMIT 20
    `, [userId, `%${q}%`]);

    res.json({
      users: result.rows.map(row => ({
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        relationshipStatus: row.relationship_status
      }))
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;