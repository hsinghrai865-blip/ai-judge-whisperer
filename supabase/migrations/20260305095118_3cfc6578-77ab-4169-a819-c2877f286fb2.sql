-- Drop overly permissive write policies
DROP POLICY "Service can insert submissions" ON public.submissions;
DROP POLICY "Service can update submissions" ON public.submissions;
DROP POLICY "Service can insert scores" ON public.ai_scores;

-- Replace with authenticated-only write policies (edge functions use service role which bypasses RLS)
-- These prevent anonymous client-side writes
CREATE POLICY "Authenticated can insert submissions" ON public.submissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update submissions" ON public.submissions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can insert scores" ON public.ai_scores FOR INSERT TO authenticated WITH CHECK (true);