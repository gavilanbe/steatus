-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE mood_type AS ENUM ('calm', 'happy', 'anxious', 'overwhelmed', 'focused', 'tired', 'shutdown', 'meltdown');
CREATE TYPE contact_status AS ENUM ('pending', 'accepted', 'blocked');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moods table
CREATE TABLE public.moods (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mood_type mood_type NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts/Friends table
CREATE TABLE public.contacts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    contact_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status contact_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, contact_user_id)
);

-- Mood acknowledgments table
CREATE TABLE public.mood_acknowledgments (
    id SERIAL PRIMARY KEY,
    mood_id INTEGER REFERENCES public.moods(id) ON DELETE CASCADE NOT NULL,
    acknowledged_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mood_id, acknowledged_by)
);

-- Push notification subscriptions
CREATE TABLE public.push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_moods_user_created ON public.moods(user_id, created_at DESC);
CREATE INDEX idx_contacts_user ON public.contacts(user_id);
CREATE INDEX idx_contacts_contact_user ON public.contacts(contact_user_id);
CREATE INDEX idx_mood_acks_mood ON public.mood_acknowledgments(mood_id);
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Moods policies  
CREATE POLICY "Users can view visible moods of contacts" ON public.moods
    FOR SELECT USING (
        is_visible = true AND (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.contacts 
                WHERE contacts.user_id = moods.user_id 
                AND contacts.contact_user_id = auth.uid() 
                AND contacts.status = 'accepted'
            )
        )
    );

CREATE POLICY "Users can insert own moods" ON public.moods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own moods" ON public.moods
    FOR UPDATE USING (auth.uid() = user_id);

-- Contacts policies
CREATE POLICY "Users can view their contacts" ON public.contacts
    FOR SELECT USING (
        auth.uid() = user_id OR auth.uid() = contact_user_id
    );

CREATE POLICY "Users can create contact requests" ON public.contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update contact requests" ON public.contacts
    FOR UPDATE USING (
        auth.uid() = user_id OR auth.uid() = contact_user_id
    );

-- Mood acknowledgments policies
CREATE POLICY "Users can view mood acknowledgments" ON public.mood_acknowledgments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.moods 
            WHERE moods.id = mood_acknowledgments.mood_id 
            AND moods.user_id = auth.uid()
        ) OR acknowledged_by = auth.uid()
    );

CREATE POLICY "Users can acknowledge moods" ON public.mood_acknowledgments
    FOR INSERT WITH CHECK (auth.uid() = acknowledged_by);

-- Push subscriptions policies
CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
        COALESCE(new.raw_user_meta_data->>'display_name', new.email)
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get current user's mood
CREATE OR REPLACE FUNCTION get_current_mood(user_uuid UUID)
RETURNS TABLE (
    id INTEGER,
    mood_type mood_type,
    is_visible BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    acknowledgment_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.mood_type,
        m.is_visible,
        m.created_at,
        COUNT(ma.id) as acknowledgment_count
    FROM public.moods m
    LEFT JOIN public.mood_acknowledgments ma ON m.id = ma.mood_id
    WHERE m.user_id = user_uuid
    GROUP BY m.id, m.mood_type, m.is_visible, m.created_at
    ORDER BY m.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;