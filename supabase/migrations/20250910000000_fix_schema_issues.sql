-- Fix schema issues for acknowledgment_count and foreign key relationships

-- Add acknowledgment_count column to moods table
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS acknowledgment_count INTEGER DEFAULT 0;

-- Create function to update acknowledgment count
CREATE OR REPLACE FUNCTION update_mood_acknowledgment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.moods 
        SET acknowledgment_count = acknowledgment_count + 1 
        WHERE id = NEW.mood_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.moods 
        SET acknowledgment_count = acknowledgment_count - 1 
        WHERE id = OLD.mood_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update acknowledgment count
DROP TRIGGER IF EXISTS trigger_update_mood_acknowledgment_count ON public.mood_acknowledgments;
CREATE TRIGGER trigger_update_mood_acknowledgment_count
    AFTER INSERT OR DELETE ON public.mood_acknowledgments
    FOR EACH ROW EXECUTE FUNCTION update_mood_acknowledgment_count();

-- Add foreign key constraint names for better relationship handling
ALTER TABLE public.contacts 
DROP CONSTRAINT IF EXISTS contacts_contact_user_id_fkey;

ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_contact_user_id_fkey 
FOREIGN KEY (contact_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update existing mood acknowledgment counts
UPDATE public.moods 
SET acknowledgment_count = (
    SELECT COUNT(*) 
    FROM public.mood_acknowledgments 
    WHERE mood_acknowledgments.mood_id = moods.id
)
WHERE acknowledgment_count = 0;
