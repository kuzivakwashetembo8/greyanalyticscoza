
-- Add missing columns for real settings persistence, report status, audit trail, terms acceptance.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS notify_whatsapp boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS upload_limit integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS accepted_terms_version text,
  ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'complete',
  ADD COLUMN IF NOT EXISTS agent_results jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS extracted_text text,
  ADD COLUMN IF NOT EXISTS upload_ids text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS methodology jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Track finding resolution state (accept / dismiss / investigating)
CREATE TABLE IF NOT EXISTS public.finding_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  finding_key text NOT NULL,
  state text NOT NULL DEFAULT 'open',
  note text,
  assignee text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, finding_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finding_states TO authenticated;
GRANT ALL ON public.finding_states TO service_role;
ALTER TABLE public.finding_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own finding_states" ON public.finding_states FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Audit / security event log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own audit_log read" ON public.audit_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own audit_log insert" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Per-user usage tracking (extraction/analysis calls, tokens)
CREATE TABLE IF NOT EXISTS public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  amount integer NOT NULL DEFAULT 1,
  cost_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.usage_events TO authenticated;
GRANT ALL ON public.usage_events TO service_role;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own usage" ON public.usage_events FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS usage_events_user_created ON public.usage_events (user_id, created_at DESC);

-- Server-side rate limit ledger (per-user, per-endpoint sliding window)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, bucket)
);
GRANT SELECT, INSERT, UPDATE ON public.rate_limits TO authenticated;
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rate_limits" ON public.rate_limits FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Extend alerts to reference the report and store a delivery snapshot
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS channel text,
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'pending';

-- Update the new-user trigger so business_name & whatsapp seed metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, business_name, role, whatsapp, accepted_terms_version, accepted_terms_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'owner'),
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'terms_version',
    CASE WHEN NEW.raw_user_meta_data->>'terms_version' IS NOT NULL THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
