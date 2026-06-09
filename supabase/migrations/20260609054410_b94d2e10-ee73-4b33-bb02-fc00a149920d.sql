CREATE TABLE public.accounting_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('xero','quickbooks','sage')),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  external_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_connections TO authenticated;
GRANT ALL ON public.accounting_connections TO service_role;
ALTER TABLE public.accounting_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own connections" ON public.accounting_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own connections" ON public.accounting_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own connections" ON public.accounting_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own connections" ON public.accounting_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX accounting_connections_user_idx ON public.accounting_connections(user_id);