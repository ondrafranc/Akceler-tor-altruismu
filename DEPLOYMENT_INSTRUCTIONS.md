# 🚀 Nasazení a databáze (Deployment & Supabase Guide)

Aplikace **Akcelerátor altruismu v2** je postavená na **SvelteKitu** (`akcelerator-landing-page/`) a je navržená tak, aby fungovala **okamžitě i bez externí databáze** (má vestavěný in-memory a kurátorovaný český fallback). Pokud připojíš Supabase, zpětná vazba, komunitní tipy a anonymní události pulzu se budou ukládat do PostgreSQL.

---

## 1. Nasazení na Vercel

1. V administraci Vercelu nastav:
   - **Root Directory**: `akcelerator-landing-page`
   - **Framework Preset**: `SvelteKit`
   - **Build Command**: `npm run build`
2. Nastav Environment Variables:
   - `PUBLIC_SUPABASE_URL` = `https://<tvuj-projekt>.supabase.co`
   - `PUBLIC_SUPABASE_ANON_KEY` = `<tvuj-public-anon-key>` (používán výchozím klientem s aktivním RLS)
   - `SUPABASE_SERVICE_ROLE_KEY` = `<tvuj-private-service-role-key>` (pouze na serveru pro autorizovanou moderaci)
   - `MODERATOR_SECRET` = `<tajny-klic-pro-moderaci>` (ověřován v `PATCH /api/submissions`)
   - `TEST_BYPASS_SECRET` = `<tajny-klic-pro-testovaci-bypass>` (pro bypass rate-limitu v neprodukčních testech)

---

## 2. Kanonické SQL schéma Supabase (`supabase/migrations/0001_initial_schema.sql`)

Oficiální verzovaná migrace se nachází v `supabase/migrations/0001_initial_schema.sql`.
Pro inicializaci nové databáze spusť v **Supabase SQL Editoru** následující skript:

```sql
-- Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabulka pro anonymní zpětnou vazbu a hlášení chyb
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    page_url TEXT,
    contact TEXT,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback (status);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous feedback insert" ON feedback
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow service_role full access to feedback" ON feedback
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Tabulka pro komunitní tipy na organizace a akce (/submit -> /near)
CREATE TABLE IF NOT EXISTS community_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind TEXT NOT NULL DEFAULT 'org' CHECK (kind IN ('org', 'event')),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    description TEXT NOT NULL,
    city TEXT,
    address TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    url TEXT,
    contact TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_community_submissions_status_coords ON community_submissions (status, lat, lon);
CREATE INDEX IF NOT EXISTS idx_community_submissions_created_at ON community_submissions (created_at DESC);

ALTER TABLE community_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous submission insert" ON community_submissions
    FOR INSERT TO anon
    WITH CHECK (status = 'pending');

CREATE POLICY "Allow public read of approved submissions" ON community_submissions
    FOR SELECT TO anon, authenticated
    USING (status = 'approved');

CREATE POLICY "Allow service_role full access to submissions" ON community_submissions
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- 3. Tabulka pro anonymní události pulzu (živý ticker dobrých skutků)
CREATE TABLE IF NOT EXISTS pulse_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id TEXT NOT NULL,
    city TEXT,
    kind TEXT NOT NULL DEFAULT 'click' CHECK (kind IN ('click', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_pulse_events_created_at ON pulse_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pulse_events_action_id ON pulse_events (action_id);

ALTER TABLE pulse_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read pulse events" ON pulse_events
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anonymous insert pulse events" ON pulse_events
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow service_role full access to pulse events" ON pulse_events
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
```
