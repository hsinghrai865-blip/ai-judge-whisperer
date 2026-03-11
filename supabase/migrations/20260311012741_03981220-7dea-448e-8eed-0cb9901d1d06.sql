
CREATE TABLE public.social_breakout_potential (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  overall_score numeric NOT NULL,
  hook_strength numeric NOT NULL,
  clipability numeric NOT NULL,
  emotional_reactivity numeric NOT NULL,
  dance_compatibility numeric NOT NULL,
  discovery_potential numeric NOT NULL,
  ai_summary text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(submission_id)
);

ALTER TABLE public.social_breakout_potential ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view social breakout" ON public.social_breakout_potential FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can insert social breakout" ON public.social_breakout_potential FOR INSERT TO authenticated WITH CHECK (true);
