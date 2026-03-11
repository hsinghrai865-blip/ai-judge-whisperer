ALTER TABLE public.vocal_dna
  ADD COLUMN IF NOT EXISTS tempo_bpm numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spectral_brightness numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dynamic_range numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onset_strength numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vocal_confidence numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timing_accuracy numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS energy_score numeric DEFAULT 0;