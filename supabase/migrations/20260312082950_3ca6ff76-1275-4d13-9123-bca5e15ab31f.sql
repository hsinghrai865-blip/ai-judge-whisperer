CREATE POLICY "Service role can update vocal_dna"
ON public.vocal_dna
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);