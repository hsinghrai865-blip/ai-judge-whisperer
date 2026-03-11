
-- Add analysis pipeline fields to vocal_dna
ALTER TABLE public.vocal_dna 
  ADD COLUMN IF NOT EXISTS analysis_status text NOT NULL DEFAULT 'ai_estimated',
  ADD COLUMN IF NOT EXISTS analysis_raw_json jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS analysis_engine text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_placeholder boolean NOT NULL DEFAULT true;

-- Add audio_url to submissions for direct audio file uploads
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS audio_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audio_analysis_status text NOT NULL DEFAULT 'none';

-- Create audio storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio-submissions', 'audio-submissions', false, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/webm', 'audio/flac'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio bucket
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-submissions');

CREATE POLICY "Authenticated users can read audio"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'audio-submissions');
