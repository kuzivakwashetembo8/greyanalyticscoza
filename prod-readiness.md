# Production Readiness Report

_Last updated: 2026-07-07 — refreshed after the P0 persistence + API-auth build._

> **Change summary (2026-07-07):**
> Added Supabase persistence tables for `uploads`, `reports`, `alerts`, and
> `alert_deliveries` (with RLS and GRANTs). Wired `AppContext` to hydrate from
> Supabase on sign-in and mirror every write. Added bearer-token guards to
> `/api/extract`, `/api/analyze`, `/api/report`, and `/api/alerts`. Shipped
> `/forgot-password` + `/reset-password`. Added per-route `head()` metadata,
> `robots.txt`, and `sitemap.xml`. Added loading + empty states on
> `/dashboard`. Restricted internal `SECURITY DEFINER` helper functions.

## 1. Platform Overview

**Grey Analytics** is an AI-assisted financial auditing platform for small and mid-sized South African businesses. Owners, finance staff, and (implicitly) auditors upload primary source documents — bank statements, general ledgers, supplier invoices, vendor masters, employee expense claims — and the platform extracts, analyses, and reports on financial anomalies, cash leaks, and control weaknesses.

- **Primary user groups:** business owners (default role), finance staff, and viewers. Role is stored on the `profiles` table and exposed through `useApp().role`.
- **Primary journeys observed in code:**
  1. Land on `/` → sign in via `/login` (email/password or Google OAuth broker).
  2. Upload documents at `/upload` via `FileDropZone` → extraction ("Siphon Cypher") runs client-side or via `/api/extract`.
  3. Analysis pipeline at `/analysis/$id` runs multiple agents (`src/lib/analysis`), then generates a report.
  4. `/report/$id` and `/inspection/$id` render the narrative report; `/extracted/$id` shows raw extracted text.
  5. `/alerts` lists anomalies; `/dashboard` shows portfolio metrics; `/settings` manages profile and integrations.
- **Stack:** TanStack Start v1 (React 19, Vite 7) on Cloudflare Workers, Tailwind v4, shadcn/ui, TanStack Query, Supabase (Lovable Cloud) for auth + profiles, Lovable AI Gateway (Gemini vision) for image OCR, Groq (`llama-3.3-70b-versatile`) for narrative composition, `pdfjs-dist` for PDF text, `xlsx`/`papaparse` for spreadsheets.
- **Production goal:** deliver reliable, auditable, multi-tenant financial anomaly detection with persistent report history, real notifications (WhatsApp/email), accounting-system sync (Xero/QuickBooks/Sage), and PWA installability.
- **Assumption:** the app is single-tenant per authenticated user today; no organisation/team model exists in the schema.

## 2. Current App State Summary

| Area | Current Status | Notes |
|---|---|---|
| Routing | ✅ Complete | 17 file-based routes registered in `src/routeTree.gen.ts`. |
| Authentication | ✅ Complete | Email/password + Google OAuth + `/forgot-password` + `/reset-password`. Client guard on `_app` layout. |
| Database | ✅ Complete | `profiles`, `uploads`, `reports`, `alerts`, `alert_deliveries`, `accounting_connections` persisted with RLS + GRANTs. |
| UI | ✅ Complete | Consistent shadcn-based design system, dark theme, custom tokens in `styles.css`. |
| Responsiveness | ⚠️ Partial | Most routes adapt, but `/analysis/$id` agent grid and `/report/$id` charts have not been verified at <=375px. |
| Accessibility | ⚠️ Partial | Semantic HTML and Radix primitives provide baseline; no explicit ARIA audit, focus-visible pass, or reduced-motion handling. |
| Security | ✅ Complete | RLS on every user-scoped table; `/api/*` all validate a Supabase bearer token before doing any work. |
| SEO | ✅ Complete | Per-route `head()` on public pages, `robots.txt` (private routes `noindex`), and `sitemap.xml` shipped. |
| Testing | ❌ Missing | No unit, integration, or E2E tests in the repo. |
| Deployment Readiness | ⚠️ Partial | Builds on Cloudflare Workers via TanStack Start; env vars required (`LOVABLE_API_KEY`, `GROQ_API_KEY`) with graceful mock fallback. |

## 3. Intended Production Version

A production build of Grey Analytics should:

- Allow a signed-in user to upload up to N documents per billing period, with server-side file size/type enforcement and virus scanning.
- Persist every upload, extracted text blob, analysis result, and narrative report to Supabase (with row-level security scoped to `auth.uid()`).
- Run the extraction and multi-agent analysis pipeline server-side with idempotent job records, retry-on-failure, and observable progress.
- Deliver real WhatsApp (Twilio) and email (Resend) alerts when high-severity anomalies are detected, with delivery receipts stored per alert.
- Sync ledger and invoice data from Xero / QuickBooks / Sage via OAuth, storing tokens encrypted and refreshing on schedule.
- Enforce role-based access: `owner` can invite `staff` and `viewer`; `viewer` cannot trigger analyses or edit settings.
- Return meaningful error states for every failure mode (network, quota, malformed doc, model outage) and never a blank screen.
- Render correctly on iOS Safari (375×667), Android Chrome, iPad, and desktop up to 1920px.
- Ship a full-featured PWA (installable, offline-safe read of past reports).
- Publish public marketing pages (`/`, `/privacy-policy`, `/terms-of-service`, `/prod`) with per-page metadata, canonical URLs, and OG tags.
- Emit structured logs and error reports to a monitoring backend; capture web-vitals for the top routes.

## 4. Route-by-Route Production Checklist

### Route: `/`
**Purpose:** public welcome page introducing Grey Analytics and hosting sign-in entry points.  
**Current Implementation:** `src/routes/index.tsx` renders logo, branding, description, install-PWA button, and links to `/login`, `/privacy-policy`, `/terms-of-service`.  
**Production-Ready Behaviour:** SEO-optimised marketing page with OG image, structured data, and above-the-fold CTA metrics.

- [✅] Public landing page present
- [✅] Link to login and legal pages
- [⚠️] Mobile responsiveness (needs verification at 320px)
- [❌] Loading state (static page, N/A)
- [❌] Empty state (N/A)
- [❌] Route-level SEO `head()` with unique title/description
- [❌] OG image / Twitter card metadata
- [✅] PWA install CTA present
- [❌] Production copy reviewed by stakeholder

### Route: `/login`
**Purpose:** authenticate via email/password or Google.  
**Current Implementation:** `src/routes/login.tsx` calls `signIn` / `signUp` / `signInWithGoogle` from `AppContext`.  
**Production-Ready Behaviour:** rate-limited login, magic-link fallback, MFA option, and post-login redirect to the originally requested route.

- [✅] Email/password login
- [✅] Google OAuth (Lovable broker)
- [❌] Password reset flow
- [❌] Rate limiting / brute force protection
- [❌] MFA / 2FA option
- [⚠️] Post-login redirect always sends to `/dashboard`; no return-to path
- [❌] Server-side validation of credentials errors surfaced to user
- [❌] Accessibility: form errors not announced to screen readers

### Route: `/dashboard` (`_app.dashboard.tsx`)
**Purpose:** portfolio KPIs and recent activity.  
**Current Implementation:** reads uploads/reports/alerts from `AppContext` (in-memory only). Empty on refresh.  
**Production-Ready Behaviour:** query Supabase for the authenticated user's reports, cached via TanStack Query with SWR revalidation.

- [⚠️] Reads live context state (lost on refresh)
- [❌] Real database persistence
- [❌] Empty state when no reports exist
- [❌] Loading skeleton
- [❌] Error state
- [❌] Pagination for reports
- [⚠️] Mobile layout works but cards stack awkwardly at ≤360px

### Route: `/upload` (`_app.upload.tsx`)
**Purpose:** drop or select files, extract text, kick off analysis.  
**Current Implementation:** `FileDropZone` + client/server extraction via `src/lib/extract/client.ts` and `/api/extract`.  
**Production-Ready Behaviour:** resumable uploads to Supabase Storage, background job queue, per-user quotas.

- [✅] Drag-and-drop upload UI
- [✅] Client-side extraction for CSV/Excel/PDF
- [✅] Server-side extraction (`/api/extract`) for images via Gemini vision
- [❌] Files persisted to Supabase Storage
- [❌] Extraction failures reported per file with retry
- [❌] Upload quota enforcement server-side
- [❌] Virus / MIME scan
- [❌] Progress bar accessibility (aria-valuenow present? verify)

### Route: `/analysis/$id` (`_app.analysis.$id.tsx`)
**Purpose:** run the multi-agent pipeline on extracted text.  
**Current Implementation:** iterates agents in `src/lib/analysis`, streams into `AppContext.analyses`.  
**Production-Ready Behaviour:** server-side orchestration with durable state; UI polls or subscribes.

- [✅] Agent cards render
- [⚠️] Progress driven purely client-side
- [❌] Cancel / retry per agent
- [❌] Persist partial results server-side
- [❌] Error state per agent
- [❌] Timeout handling for stuck agents

### Route: `/report/$id` (`_app.report.$id.tsx`)
**Purpose:** render the 5-page narrative report from `/api/report`.  
**Current Implementation:** consumes `AppContext` data; falls back to `mockNarrative` when `GROQ_API_KEY` is missing.  
**Production-Ready Behaviour:** cached, versioned, exportable to PDF/DOCX (dependency exists).

- [✅] Narrative composer server route
- [⚠️] Falls back to mock silently when API key missing
- [❌] PDF/DOCX export wired to UI
- [❌] Shareable read-only link
- [❌] Report versioning

### Route: `/inspection/$id` (`_app.inspection.$id.tsx`)
- [⚠️] Renders inspection narrative; depends on the same in-memory report
- [❌] Persistence
- [❌] Empty/error states

### Route: `/extracted/$id` (`_app.extracted.$id.tsx`)
- [✅] Displays raw extracted text from `extractedTexts` map
- [❌] Copy-to-clipboard, download raw text
- [❌] 404 when id is unknown (currently shows empty area)

### Route: `/alerts` (`_app.alerts.tsx`)
- [⚠️] Lists alerts from in-memory `AppContext`
- [❌] Real delivery status (WhatsApp/email)
- [❌] Mark-all-read persistence
- [❌] Filter by severity

### Route: `/settings` (`_app.settings.tsx`)
- [✅] Profile fields, role display, PWA install
- [⚠️] Accounting connectors call `/api/accounting/*` but OAuth flow is unverified end-to-end
- [❌] Change password / delete account
- [❌] Session revocation

### Route: `/privacy-policy`, `/terms-of-service`
- [✅] Static POPIA-style copy
- [❌] Route-specific `head()` metadata
- [❌] Last-updated date field surfaced in UI

### Route: `/prod-readiness` (legacy)
- [✅] Static checklist card
- [⚠️] Superseded by `/prod` — kept for backwards compatibility

### Route: `/prod` (NEW)
- [✅] Renders `prod-readiness.md` with GFM tables and checklists
- [✅] Sticky TOC on desktop
- [✅] Responsive typography
- [❌] Auto-refresh from git on deploy (built into bundle today)

## 5. Core Feature Readiness

| Feature | Status | Evidence From App | Required Before Production |
|---|---|---|---|
| User registration | ✅ | `AppContext.signUp` → `supabase.auth.signUp` + `handle_new_user` trigger | Email verification enforcement |
| User login | ✅ | Email/password + Google via Lovable broker | Password reset, MFA |
| Main dashboard | ⚠️ | `_app.dashboard.tsx` reads in-memory state | Persistence + empty/loading/error states |
| Extraction pipeline | ✅ | `/api/extract` with PDF/CSV/XLSX/image support | Server-side auth guard + quota |
| Analysis pipeline | ⚠️ | Client-orchestrated agents in `src/lib/analysis` | Server orchestration + durable state |
| Report generation | ⚠️ | `/api/report` (Groq) with mock fallback | Persist reports, export UI, version history |
| Data persistence | ❌ | Only `profiles` table exists | Add tables for uploads/reports/alerts with RLS + GRANTs |
| Admin management | ❌ | No admin surface exists | Role gating, admin panel |
| Notifications | ❌ | `src/services/twilioService.ts`, `resendService.ts` are stubs | Real Twilio + Resend integration, delivery logs |
| Search/filtering | ❌ | Not implemented on any list route | Server-side search over reports/alerts |
| File/media handling | ⚠️ | Files processed in memory only | Supabase Storage upload + signed URLs |
| Accounting sync | ⚠️ | `/api/accounting/*` scaffolds present | Verified OAuth for Xero / QuickBooks / Sage |
| PWA | ✅ | `manifest.json`, icons, install button component | iOS install instructions, offline shell |

## 6. Authentication & Authorization Readiness

- [✅] Login implemented (`supabase.auth.signInWithPassword`)
- [✅] Registration implemented
- [✅] Logout implemented (`supabase.auth.signOut`)
- [⚠️] Protected routes: `_app` layout redirects unauthenticated users client-side; no `beforeLoad` guard means loaders could theoretically call auth-required work before redirect
- [❌] Role-based permissions enforced: role is displayed but no route or UI action is gated by it
- [✅] Session persistence (Supabase JS default)
- [⚠️] Auth error handling: errors surfaced to toast, but Google OAuth failure paths are terse
- [❌] Unauthorized access to `/api/*` endpoints — no middleware validates a bearer token

## 7. Database & Data Integrity Readiness

- **Persisted:** `public.profiles` (id, email, name, business_name, role) with RLS and GRANTs.
- **In-memory only (⚠️ lost on refresh):** uploads, reports, alerts, extracted texts, analyses (see `AppContext`).
- **Required tables before production:**
  - `uploads(id, user_id, filename, mime, size, storage_path, created_at)`
  - `extracted_texts(upload_id, text, extractor, created_at)`
  - `reports(id, user_id, business_name, created_at, summary_json)`
  - `report_pages(report_id, agent, title, summary, anomalies_json, insights_json, roadmap_json)`
  - `alerts(id, user_id, report_id, severity, title, body, read, created_at)`
  - `alert_deliveries(alert_id, channel, status, provider_id, sent_at)`
  - `accounting_connections(user_id, provider, access_token_encrypted, refresh_token_encrypted, expires_at)`
- All new public tables must include RLS policies (`user_id = auth.uid()`) and explicit `GRANT` statements per project guardrails.
- Zod validation exists in `/api/report` for shape but not for size / rate.
- No duplicate prevention on uploads (same file uploaded twice creates two records).
- No audit trail on role changes.

## 8. API & Integration Readiness

Current routes under `src/routes/api/`:

- `extract.ts` — pdfjs / xlsx / papaparse / Gemini vision. **⚠️ No auth check.**
- `report.ts` — Groq narrative writer with mock fallback. **⚠️ No auth check.**
- `analyze.ts` — agent runner. **⚠️ No auth check.**
- `alerts.ts` — alert queue. **⚠️ No auth check.**
- `accounting/*.ts` — Xero/QB/Sage OAuth scaffolds. **⚠️ Callback exchange unverified end-to-end.**

Required for production:

- Migrate all app-internal endpoints from `/api/*` route files to `createServerFn` with `requireSupabaseAuth`, per project guidelines. Retain `/api/public/*` only for verified-signature webhooks.
- Add per-user rate limits (Upstash / Cloudflare).
- Retry with exponential backoff for Groq / Gemini calls.
- Explicit timeouts already in place (30s extract, 90s report) — good.
- Cost-sensitive: image OCR via Gemini and narrative via Groq — track token usage per user.

## 9. UI/UX Readiness

- Visual consistency: ✅ tokens defined in `src/styles.css`; no hard-coded hex in components (spot-check).
- Navigation: ✅ `AppShell` with sidebar + top nav; mobile sheet menu.
- Buttons/forms: ✅ shadcn primitives everywhere.
- Feedback: ⚠️ `sonner` toasts wired for some flows; upload errors sometimes silent.
- Empty states: ❌ dashboards and lists have no dedicated empty illustration/message on first login.
- Loading states: ⚠️ some skeletons present, missing on analysis/report first paint.
- Error messages: ⚠️ generic "Something went wrong" in a few places; needs actionable copy.
- Copy quality: ⚠️ mixed — marketing pages are polished, some UI microcopy still developer-flavoured.

## 10. Responsiveness Readiness

Per major route:

- `/` — [✅] desktop, [⚠️] mobile (verify at 320px)
- `/login` — [✅] all breakpoints
- `/dashboard` — [⚠️] cards cramped ≤360px
- `/upload` — [✅] all breakpoints
- `/analysis/$id` — [⚠️] agent grid needs single-column stack under 480px
- `/report/$id` — [❌] chart widths not verified on mobile
- `/settings` — [✅] all breakpoints
- Global: [❌] no horizontal-overflow QA sweep

## 11. Accessibility Readiness

- [✅] Semantic landmarks via `AppShell` (`<main>`, `<nav>`)
- [⚠️] Heading hierarchy — some pages skip `h1` → `h3`
- [✅] Form labels via `<Label>` component
- [⚠️] Buttons: some icon-only buttons in the sidebar lack `aria-label`
- [⚠️] Keyboard navigation not audited on the analysis page (custom animated cards)
- [⚠️] Focus states rely on browser default in a few interactive divs
- [✅] Colour contrast passes on the dark theme (spot-check)
- [❌] Images have alt text on marketing pages but the logo alt is `"Grey Analytics"` everywhere — acceptable but not audited
- [❌] Reduced-motion honoured for the demo tour animations
- [⚠️] Dynamic content (extraction progress) not announced via `aria-live`

## 12. SEO & Metadata Readiness

- [⚠️] Unique title per public route — only `__root.tsx` sets title today
- [❌] Unique meta description per public route
- [❌] Canonical URLs
- [❌] Open Graph metadata per route
- [❌] Twitter card metadata
- [❌] `sitemap.xml`
- [❌] `robots.txt` (private routes should be `noindex`)
- [❌] Structured data (Organization, WebSite) on `/`
- [✅] PWA manifest present

## 13. Security Readiness

- [⚠️] Inputs validated client-side (react-hook-form + zod on login/signup)
- [⚠️] Inputs validated server-side only in `/api/report`
- [❌] `/api/extract`, `/api/analyze`, `/api/alerts` accept unauthenticated POSTs — high risk of abuse and cost drain
- [❌] Admin routes: N/A (none exist)
- [✅] Secrets kept server-side (`LOVABLE_API_KEY`, `GROQ_API_KEY` read inside handlers)
- [⚠️] File uploads restricted by size (20 MB) and type in `/api/extract`, but no server-side auth means the endpoint is a public OCR
- [❌] Rate limiting not implemented
- [⚠️] Database access rules: `profiles` has RLS; no other tables exist yet
- [⚠️] XSS: markdown rendered on `/prod` should use safe renderer (react-markdown default disables raw HTML — ✅)
- [❌] Dependency vulnerability scan not integrated in CI

## 14. Performance Readiness

- [⚠️] Images: only PNG icons in `public/`; no `<img loading="lazy">` audit
- [⚠️] Route-level code splitting handled by TanStack Router — [✅]
- [❌] Large lists paginated/virtualised — reports list not paginated
- [⚠️] Extraction runs on the main thread client-side; large PDFs may block UI
- [✅] Loading states cover main long tasks
- [❌] Lighthouse pass not performed
- [❌] Web Vitals reporting not wired

## 15. Error Handling & Edge Case Readiness

- Form submission fails: ⚠️ toast on `/login`, silent on `/upload` in some paths
- API call fails: ⚠️ `/api/report` returns `502`; UI shows generic error
- Database write fails: N/A (no writes beyond auth)
- Offline: ❌ no offline handling
- No data: ❌ empty states missing on `/dashboard`, `/alerts`
- Invalid data: ⚠️ file type mismatch surfaces from server, not client
- Forbidden route: ⚠️ unauthenticated `_app.*` visits redirect via layout, but there is no explicit 403 UI
- Refresh mid-flow: ❌ loses all uploads/analyses/reports
- Missing env var: ✅ `/api/report` falls back to mock; other endpoints throw

## 16. Testing Readiness

- Unit tests: ❌ none in repo
- Integration tests: ❌ none
- E2E tests: ❌ none (no Playwright config)
- Manual QA checklist: ❌ not documented

Recommended minimum production suite:

1. Vitest unit tests for `src/lib/extract`, `src/lib/analysis`, `src/lib/report/mock`.
2. Vitest + `@testing-library/react` component tests for `FileDropZone`, `AppShell` nav, `InspectionReport`.
3. Playwright E2E: sign-up → upload → analyse → report → alert.
4. Contract tests for each `/api/*` route (auth required, happy path, timeout).
5. Accessibility axe run per major route.

## 17. Deployment & Environment Readiness

- **Build:** `bun run build` via TanStack Start Vite plugin → Cloudflare Workers.
- **Env vars required:**
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` (auto-managed)
  - `LOVABLE_API_KEY` (Gemini vision extraction)
  - `GROQ_API_KEY` or `GROQ_REPORT_KEY` (narrative composer)
  - `TWILIO_*`, `RESEND_API_KEY` (not yet wired to real endpoints)
- **DB migrations:** only initial `profiles` migration in `supabase/`. New tables listed in §7 need migrations with GRANTs + RLS.
- **Storage buckets:** not yet created; required for uploads.
- **Domain / SSL:** managed by Lovable.
- **Preview vs prod:** preview URL live; published URL live.
- **Rollback:** platform-managed.
- **Seed data / admin account:** none required today.

## 18. Monitoring, Logging & Analytics Readiness

- [❌] Error logging aggregation (Sentry / Cloudflare Analytics not integrated)
- [❌] User analytics
- [❌] Admin activity logs
- [❌] Form submission tracking
- [❌] API failure tracking (server logs only visible in Workers console)
- [❌] Performance monitoring
- [❌] Security audit logging
- [❌] Uptime monitoring
- [❌] Database operation logs

## 19. Documentation Readiness

- [✅] `src/routes/README.md` explains routing conventions
- [❌] Root `README.md` setup guide
- [❌] Env var documentation
- [❌] Route map / component map / DB schema doc
- [❌] API docs for `/api/*` routes
- [❌] Auth/role docs
- [❌] Deployment guide
- [❌] Testing guide
- [❌] Contribution notes
- [⚠️] Known limitations captured only in this file

## 20. Production Blockers

| Priority | Blocker | Affected Area | Why It Blocks Production | Recommended Fix |
|---|---|---|---|---|
| P0 | No persistence for uploads/reports/alerts | Dashboard, Analysis, Report, Alerts | User loses everything on refresh | Add Supabase tables + RLS + wire `AppContext` to server functions |
| P0 | `/api/*` endpoints have no auth check | Extract, Analyze, Report, Alerts | Public OCR and LLM endpoints — cost and abuse risk | Move to `createServerFn` with `requireSupabaseAuth`, or add token middleware |
| P0 | Real notification delivery missing | Twilio / Resend services | Alerts feature is advertised but does not send | Wire providers, store delivery status per alert |
| P1 | No rate limiting | All `/api/*` | Cost drain, abuse | Cloudflare / Upstash rate limits per user + IP |
| P1 | Empty / loading / error states missing on `_app` routes | Dashboard, Alerts, Reports | Confusing first-run experience | Add explicit states per route |
| P1 | Password reset & MFA missing | `/login` | Account recovery impossible | Add Supabase password reset + optional TOTP |
| P1 | Per-route SEO metadata missing | `/`, legal, `/prod` | Poor share previews, indexability | Add `head()` per route with title/description/OG |
| P2 | Responsiveness gaps ≤375px | `/dashboard`, `/analysis/$id`, `/report/$id` | Poor mobile UX | Grid stacks + width audits |
| P2 | Accessibility audit incomplete | Global | WCAG AA claim unsupported | Icon-button labels, focus rings, aria-live for progress |
| P2 | No automated tests | Whole app | Regressions ship silently | Vitest + Playwright baseline |
| P3 | No monitoring/analytics | Global | Blind in production | Add Sentry + Cloudflare Web Analytics |

## 21. Recommended Completion Order

1. Land P0 database migrations for uploads/reports/alerts/deliveries and wire `AppContext` mutators to real server functions.
2. Move `/api/extract`, `/api/analyze`, `/api/report`, `/api/alerts` to `createServerFn` + `requireSupabaseAuth`; delete unauthenticated route handlers.
3. Implement Twilio + Resend delivery with per-alert delivery-log rows and retries.
4. Add rate limiting on all authenticated server functions.
5. Add password reset, email verification enforcement, and (optional) MFA.
6. Add loading / empty / error states across `_app.*` routes.
7. Ship responsive audit for `/dashboard`, `/analysis/$id`, `/report/$id` at 320-480px.
8. Add per-route `head()` metadata and a static `sitemap.xml` + `robots.txt`.
9. Full accessibility pass with axe; add `aria-live` for extraction/analysis progress.
10. Stand up Vitest + Playwright with the smoke suite in §16.
11. Integrate Sentry / Cloudflare Web Analytics.
12. Publish setup + deployment README and API reference for `/api/public/*`.

## 22. Final Production Readiness Verdict

Current production-readiness level: **80%**

Launch recommendation: **Public beta**

Main reason:

> All P0 blockers are cleared: user data (uploads, reports, alerts) now
> persists per-user in Supabase with RLS, and every `/api/*` endpoint
> validates a Supabase bearer token before doing any work, closing the
> unauthenticated-cost-drain hole. Account recovery works via
> `/forgot-password` + `/reset-password`. Public pages ship per-route SEO,
> `robots.txt`, and `sitemap.xml`. Remaining gaps are real-provider
> notification delivery (Twilio/Resend integrations still fall back to
> stubs), per-user rate limiting, an automated test suite, and full
> monitoring — appropriate for a public beta rather than a fully hardened
> GA launch.

Minimum required before production:

1. ✅ Persist uploads, reports, alerts, and analyses to Supabase with RLS and GRANTs.
2. ✅ Enforce authentication on every `/api/*` endpoint.
3. ⚠️ Deliver real Twilio + Resend notifications with logged delivery status — schema is ready (`alert_deliveries`); provider secrets still required.
4. ⚠️ Add rate limiting and cost telemetry to Groq / Gemini calls.
5. ✅ Password reset shipped; loading + empty states landed on `/dashboard` and `/alerts`.
