
CREATE TABLE public.vocal_dna (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  vocal_range_low text NOT NULL,
  vocal_range_high text NOT NULL,
  vocal_classification text NOT NULL,
  pitch_accuracy numeric NOT NULL,
  rhythm_timing numeric NOT NULL,
  tone_profiles text[] NOT NULL DEFAULT '{}',
  genre_probabilities jsonb NOT NULL DEFAULT '[]',
  performance_energy numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(submission_id)
);

ALTER TABLE public.vocal_dna ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vocal dna" ON public.vocal_dna FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can insert vocal dna" ON public.vocal_dna FOR INSERT TO authenticated WITH CHECK (true);
