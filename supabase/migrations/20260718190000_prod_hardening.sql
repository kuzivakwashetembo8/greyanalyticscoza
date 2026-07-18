-- Locked-checklist hardening: provision private originals storage and retain
-- enough metadata to link every file to its upload and report.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('original-documents', 'original-documents', false, 20971520)
ON CONFLICT (id) DO UPDATE
SET public = false, file_size_limit = EXCLUDED.file_size_limit;

CREATE INDEX IF NOT EXISTS uploads_user_report_idx
  ON public.uploads (user_id, report_id, created_at DESC);

CREATE INDEX IF NOT EXISTS uploads_user_storage_path_idx
  ON public.uploads (user_id, storage_path)
  WHERE storage_path IS NOT NULL;

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS analysis_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS narrative jsonb,
  ADD COLUMN IF NOT EXISTS report_version integer NOT NULL DEFAULT 0;
