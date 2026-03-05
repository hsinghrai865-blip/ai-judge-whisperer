-- Platforms enum
CREATE TYPE public.platform_source AS ENUM ('casablanca', 'growth-tour');

-- Submission status enum
CREATE TYPE public.submission_status AS ENUM ('pending', 'judging', 'scored');

-- Content type enum
CREATE TYPE public.content_type AS ENUM ('audio', 'video', 'text', 'image');

-- Submissions table (shared across both platforms)
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  category TEXT NOT NULL,
  platform public.platform_source NOT NULL,
  status public.submission_status NOT NULL DEFAULT 'pending',
  content_type public.content_type NOT NULL,
  content_url TEXT,
  content_text TEXT,
  description TEXT,
  external_id TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI scores table
CREATE TABLE public.ai_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  technical_skill NUMERIC(3,1) NOT NULL CHECK (technical_skill >= 0 AND technical_skill <= 10),
  creativity_originality NUMERIC(3,1) NOT NULL CHECK (creativity_originality >= 0 AND creativity_originality <= 10),
  emotional_impact NUMERIC(3,1) NOT NULL CHECK (emotional_impact >= 0 AND emotional_impact <= 10),
  potential NUMERIC(3,1) NOT NULL CHECK (potential >= 0 AND potential <= 10),
  overall_score NUMERIC(3,1) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 10),
  feedback TEXT NOT NULL,
  model_used TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(submission_id)
);

-- Indexes
CREATE INDEX idx_submissions_platform ON public.submissions(platform);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_submissions_category ON public.submissions(category);
CREATE INDEX idx_ai_scores_submission ON public.ai_scores(submission_id);
CREATE INDEX idx_ai_scores_overall ON public.ai_scores(overall_score DESC);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_scores ENABLE ROW LEVEL SECURITY;

-- Public read access (judging dashboard is open for now)
CREATE POLICY "Anyone can view submissions" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Anyone can view scores" ON public.ai_scores FOR SELECT USING (true);

-- Service can insert/update (edge functions use service role)
CREATE POLICY "Service can insert submissions" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update submissions" ON public.submissions FOR UPDATE USING (true);
CREATE POLICY "Service can insert scores" ON public.ai_scores FOR INSERT WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();