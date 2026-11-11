-- ============================================================================
-- Akcelerátor altruismu — Canonical Supabase Schema Migration 0001
-- Covers: feedback, community_submissions, pulse_events
-- Active Row Level Security (RLS) configured for anon and service_role.
-- ============================================================================

-- Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Table: feedback (Anonymous feedback and broken link reports)
-- ----------------------------------------------------------------------------
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

-- Allow anonymous users to submit feedback
CREATE POLICY "Allow anonymous feedback insert" ON feedback
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow service_role full access to feedback
CREATE POLICY "Allow service_role full access to feedback" ON feedback
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 2. Table: community_submissions (/submit -> /near moderation workflow)
-- ----------------------------------------------------------------------------
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

-- Anonymous users may insert pending submissions only
CREATE POLICY "Allow anonymous submission insert" ON community_submissions
    FOR INSERT TO anon
    WITH CHECK (status = 'pending');

-- Public users (anon & authenticated) can only read approved submissions
CREATE POLICY "Allow public read of approved submissions" ON community_submissions
    FOR SELECT TO anon, authenticated
    USING (status = 'approved');

-- Allow service_role full management access (moderation updates, rejections, deletes)
CREATE POLICY "Allow service_role full access to submissions" ON community_submissions
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 3. Table: pulse_events (Anonymous live altruism activity ticker)
-- ----------------------------------------------------------------------------
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

-- Allow public read of pulse events for live ticker (last 24 hours)
CREATE POLICY "Allow public read pulse events" ON pulse_events
    FOR SELECT TO anon, authenticated
    USING (true);

-- Allow anonymous insertion of click/completed pulse events
CREATE POLICY "Allow anonymous insert pulse events" ON pulse_events
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow service_role full management access
CREATE POLICY "Allow service_role full access to pulse events" ON pulse_events
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

