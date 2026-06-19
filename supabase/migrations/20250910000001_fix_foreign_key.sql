-- Fix foreign key constraint that was causing auth issues

-- Revert the foreign key constraint back to reference auth.users instead of profiles
ALTER TABLE public.contacts 
DROP CONSTRAINT IF EXISTS contacts_contact_user_id_fkey;

ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_contact_user_id_fkey 
FOREIGN KEY (contact_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
