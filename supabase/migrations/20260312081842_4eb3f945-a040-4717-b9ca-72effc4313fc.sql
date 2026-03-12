CREATE POLICY "Allow public uploads to public-demos folder"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'audio-submissions' AND (storage.foldername(name))[1] = 'public-demos');