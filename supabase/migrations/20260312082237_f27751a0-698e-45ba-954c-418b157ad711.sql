CREATE POLICY "Allow authenticated uploads to audio-submissions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-submissions');