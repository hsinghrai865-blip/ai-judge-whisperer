ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS submitter_email text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS origin text DEFAULT 'internal';