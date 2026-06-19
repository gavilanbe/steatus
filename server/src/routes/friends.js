import express from 'express';
import { supabase } from '../lib/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Generate a new friend code for the user
router.post('/generate-code', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Generate a random 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Check if code already exists (very unlikely but better to be safe)
    const { data: existingCode } = await supabase
      .from('friend_codes')
      .select('code')
      .eq('code', code)
      .single();
    
    if (existingCode) {
      // If code exists, recursively try again
      return res.status(500).json({ error: 'Code generation failed, please try again' });
    }
    
    // Delete any existing code for this user
    await supabase
      .from('friend_codes')
      .delete()
      .eq('user_id', userId);
    
    // Insert new code
    const { data, error } = await supabase
      .from('friend_codes')
      .insert({
        user_id: userId,
        code: code,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        is_active: true
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating friend code:', error);
      return res.status(500).json({ error: 'Failed to generate friend code' });
    }
    
    res.json({ code: data.code, expires_at: data.expires_at });
  } catch (error) {
    console.error('Error in generate-code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's current friend code
router.get('/my-code', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data, error } = await supabase
      .from('friend_codes')
      .select('code, expires_at, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching friend code:', error);
      return res.status(500).json({ error: 'Failed to fetch friend code' });
    }
    
    if (!data) {
      return res.json({ code: null });
    }
    
    res.json({ code: data.code, expires_at: data.expires_at });
  } catch (error) {
    console.error('Error in my-code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Use a friend code to add someone as a friend
router.post('/use-code', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Friend code is required' });
    }
    
    // Find the friend code
    const { data: friendCode, error: codeError } = await supabase
      .from('friend_codes')
      .select('user_id, expires_at')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();
    
    if (codeError || !friendCode) {
      return res.status(404).json({ error: 'Invalid or expired friend code' });
    }
    
    const friendId = friendCode.user_id;
    
    // Check if user is trying to add themselves
    if (friendId === userId) {
      return res.status(400).json({ error: 'Cannot add yourself as a friend' });
    }
    
    // Check if they're already friends
    const { data: existingFriend } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', userId)
      .eq('contact_user_id', friendId)
      .single();
    
    if (existingFriend) {
      return res.status(400).json({ error: 'Already friends with this user' });
    }
    
    // Get friend's profile
    const { data: friendProfile, error: profileError } = await supabase
      .from('profiles')
      .select('username, avatar_emoji')
      .eq('id', friendId)
      .single();
    
    if (profileError) {
      console.error('Error fetching friend profile:', profileError);
      return res.status(500).json({ error: 'Failed to fetch friend profile' });
    }
    
    // Add the friendship (both directions)
    const { error: contactError1 } = await supabase
      .from('contacts')
      .insert({
        user_id: userId,
        contact_user_id: friendId,
        relationship_type: 'friend'
      });
    
    if (contactError1) {
      console.error('Error creating contact 1:', contactError1);
      return res.status(500).json({ error: 'Failed to add friend' });
    }
    
    const { error: contactError2 } = await supabase
      .from('contacts')
      .insert({
        user_id: friendId,
        contact_user_id: userId,
        relationship_type: 'friend'
      });
    
    if (contactError2) {
      console.error('Error creating contact 2:', contactError2);
      // Remove the first contact if second fails
      await supabase
        .from('contacts')
        .delete()
        .eq('user_id', userId)
        .eq('contact_user_id', friendId);
      
      return res.status(500).json({ error: 'Failed to add friend' });
    }
    
    res.json({ 
      message: 'Friend added successfully', 
      friend: {
        id: friendId,
        username: friendProfile.username,
        avatar_emoji: friendProfile.avatar_emoji
      }
    });
  } catch (error) {
    console.error('Error in use-code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send friend request via email
router.post('/invite-email', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, message } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Get user's profile for the invitation
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }
    
    // Generate a friend code if user doesn't have one
    let code;
    const { data: existingCode } = await supabase
      .from('friend_codes')
      .select('code')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();
    
    if (existingCode) {
      code = existingCode.code;
    } else {
      // Generate new code
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      await supabase
        .from('friend_codes')
        .delete()
        .eq('user_id', userId);
      
      await supabase
        .from('friend_codes')
        .insert({
          user_id: userId,
          code: code,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
          is_active: true
        });
    }
    
    // Here you would typically send an email using a service like SendGrid, Nodemailer, etc.
    // For now, we'll just return the invitation details
    
    res.json({ 
      message: 'Invitation prepared successfully',
      invitation: {
        email,
        code,
        from: userProfile.username,
        customMessage: message
      }
    });
  } catch (error) {
    console.error('Error in invite-email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get list of friends
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        contact_user_id,
        profiles!contacts_contact_user_id_fkey (
          id,
          username,
          avatar_emoji
        )
      `)
      .eq('user_id', userId)
      .eq('relationship_type', 'friend');
    
    if (error) {
      console.error('Error fetching friends:', error);
      return res.status(500).json({ error: 'Failed to fetch friends' });
    }
    
    const friends = data.map(contact => ({
      id: contact.profiles.id,
      username: contact.profiles.username,
      avatar_emoji: contact.profiles.avatar_emoji
    }));
    
    res.json({ friends });
  } catch (error) {
    console.error('Error in list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;