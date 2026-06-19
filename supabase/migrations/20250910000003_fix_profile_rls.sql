-- Fix RLS policy for profile creation during user signup

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create a new policy that allows the trigger to work
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (
        -- Allow if the current user matches the profile being created
        auth.uid() = id 
        OR 
        -- Allow if this is being called from the trigger (no current user context)
        auth.uid() IS NULL
    );

-- Alternative: Update the trigger function to use a different approach
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_username text;
    new_display_name text;
BEGIN
    -- Generate username and display name
    new_username := COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8));
    new_display_name := COALESCE(new.raw_user_meta_data->>'display_name', new.email);
    
    -- Insert into profiles using a function that bypasses RLS
    PERFORM public.create_profile_for_user(new.id, new_username, new_display_name);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function that can bypass RLS
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
    user_id uuid,
    username text,
    display_name text
)
RETURNS void AS $$
BEGIN
    -- This function runs with elevated privileges and can bypass RLS
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (user_id, username, display_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(uuid, text, text) TO postgres, anon, authenticated, service_role;
