import { createClient } from '@supabase/supabase-js'

// Support both local and cloud Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file or use local development.')
}

console.log('🔌 Connecting to Supabase:', supabaseUrl.includes('localhost') ? 'Local' : 'Cloud')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database types
export interface Profile {
  id: string
  username: string
  display_name: string
  bio?: string
  avatar_url?: string
  avatar_emoji?: string
  created_at: string
  updated_at: string
}

export interface Mood {
  id: number
  user_id: string
  mood_type: 'calm' | 'happy' | 'anxious' | 'overwhelmed' | 'focused' | 'tired' | 'shutdown' | 'meltdown'
  is_visible: boolean
  created_at: string
  acknowledgment_count?: number
}

export interface Contact {
  id: number
  user_id: string
  contact_user_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  contact_profile?: Profile
  current_mood?: Mood
}

export interface MoodAcknowledgment {
  id: number
  mood_id: number
  acknowledged_by: string
  created_at: string
  acknowledged_by_profile?: Profile
}

// Helper functions
export const getCurrentUser = () => {
  return supabase.auth.getUser()
}

export const uploadAvatar = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/avatar.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true })
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)
  
  return publicUrl
}

export const getAvatarUrl = (userId: string) => {
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${userId}/avatar`)
    
  return data.publicUrl
}

// Real-time subscriptions
export const subscribeToUserMoods = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`user-moods:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'moods',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}

export const subscribeToContactMoods = (contactIds: string[], callback: (payload: any) => void) => {
  if (contactIds.length === 0) return null
  
  return supabase
    .channel('contact-moods')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'moods',
        filter: `user_id=in.(${contactIds.join(',')})`
      },
      callback
    )
    .subscribe()
}

export const subscribeToMoodAcknowledgments = (moodId: number, callback: (payload: any) => void) => {
  return supabase
    .channel(`mood-acks:${moodId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mood_acknowledgments',
        filter: `mood_id=eq.${moodId}`
      },
      callback
    )
    .subscribe()
}