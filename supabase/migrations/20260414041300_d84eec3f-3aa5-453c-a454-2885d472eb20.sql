
-- Add image_url column to habits
ALTER TABLE public.habits ADD COLUMN image_url TEXT;

-- Create storage bucket for habit images
INSERT INTO storage.buckets (id, name, public) VALUES ('habit-images', 'habit-images', true);

-- Storage policies
CREATE POLICY "Habit images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'habit-images');

CREATE POLICY "Users can upload their own habit images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'habit-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own habit images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'habit-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own habit images"
ON storage.objects FOR DELETE
USING (bucket_id = 'habit-images' AND auth.uid()::text = (storage.foldername(name))[1]);
