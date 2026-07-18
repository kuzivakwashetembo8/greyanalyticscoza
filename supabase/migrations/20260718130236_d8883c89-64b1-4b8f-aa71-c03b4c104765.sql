
ALTER TABLE public.uploads
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS uploads_user_hash_idx ON public.uploads (user_id, content_hash);

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS alerts_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS totals jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.rl_check(_bucket text, _limit int, _window_minutes int)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); cur_count int; cur_start timestamptz;
BEGIN
  IF uid IS NULL THEN RETURN FALSE; END IF;
  INSERT INTO public.rate_limits(user_id, bucket, window_start, count)
  VALUES (uid, _bucket, now(), 0) ON CONFLICT (user_id, bucket) DO NOTHING;
  SELECT count, window_start INTO cur_count, cur_start
  FROM public.rate_limits WHERE user_id = uid AND bucket = _bucket FOR UPDATE;
  IF cur_start < now() - make_interval(mins => _window_minutes) THEN
    UPDATE public.rate_limits SET window_start = now(), count = 1
    WHERE user_id = uid AND bucket = _bucket;
    RETURN TRUE;
  END IF;
  IF cur_count >= _limit THEN RETURN FALSE; END IF;
  UPDATE public.rate_limits SET count = count + 1
  WHERE user_id = uid AND bucket = _bucket;
  RETURN TRUE;
END; $$;
REVOKE ALL ON FUNCTION public.rl_check(text, int, int) FROM public;
GRANT EXECUTE ON FUNCTION public.rl_check(text, int, int) TO authenticated;

-- rl_check with a userId arg (called from service-role edge context)
CREATE OR REPLACE FUNCTION public.rl_check_for(_user uuid, _bucket text, _limit int, _window_minutes int)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cur_count int; cur_start timestamptz;
BEGIN
  IF _user IS NULL THEN RETURN FALSE; END IF;
  INSERT INTO public.rate_limits(user_id, bucket, window_start, count)
  VALUES (_user, _bucket, now(), 0) ON CONFLICT (user_id, bucket) DO NOTHING;
  SELECT count, window_start INTO cur_count, cur_start
  FROM public.rate_limits WHERE user_id = _user AND bucket = _bucket FOR UPDATE;
  IF cur_start < now() - make_interval(mins => _window_minutes) THEN
    UPDATE public.rate_limits SET window_start = now(), count = 1
    WHERE user_id = _user AND bucket = _bucket;
    RETURN TRUE;
  END IF;
  IF cur_count >= _limit THEN RETURN FALSE; END IF;
  UPDATE public.rate_limits SET count = count + 1
  WHERE user_id = _user AND bucket = _bucket;
  RETURN TRUE;
END; $$;
REVOKE ALL ON FUNCTION public.rl_check_for(uuid, text, int, int) FROM public;
GRANT EXECUTE ON FUNCTION public.rl_check_for(uuid, text, int, int) TO service_role;

DROP POLICY IF EXISTS "originals_read_own" ON storage.objects;
CREATE POLICY "originals_read_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'original-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "originals_insert_own" ON storage.objects;
CREATE POLICY "originals_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'original-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "originals_delete_own" ON storage.objects;
CREATE POLICY "originals_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'original-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
