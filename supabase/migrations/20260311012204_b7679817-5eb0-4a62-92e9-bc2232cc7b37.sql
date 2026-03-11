
CREATE TABLE public.artist_potential_index (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  overall_score numeric NOT NULL,
  commercial_appeal numeric NOT NULL,
  memorability numeric NOT NULL,
  replay_value numeric NOT NULL,
  brand_identity_potential numeric NOT NULL,
  growth_potential numeric NOT NULL,
  market_fit jsonb NOT NULL DEFAULT '[]',
  ai_summary text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(submission_id)
);

ALTER TABLE public.artist_potential_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view artist potential index" ON public.artist_potential_index FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can insert artist potential index" ON public.artist_potential_index FOR INSERT TO authenticated WITH CHECK (true);
