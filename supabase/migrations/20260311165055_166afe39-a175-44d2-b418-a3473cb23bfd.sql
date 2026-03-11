
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS languages text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS social_handle text,
  ADD COLUMN IF NOT EXISTS years_experience text;
