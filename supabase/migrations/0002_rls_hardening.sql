-- ============================================================================
-- Akcelerátor altruismu — Supabase Schema & RLS Hardening Migration 0002
-- Hardens column-level privacy (excludes ip_hash), adds event date columns,
-- enforces length & Czechia coordinate bounds, and restricts anon policies.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Table: community_submissions — event dates, column-level SELECT, CHECKs
-- ----------------------------------------------------------------------------
ALTER TABLE public.community_submissions
    ADD COLUMN IF NOT EXISTS event_start TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS event_end TIMESTAMPTZ;

-- Prevent direct anon/authenticated PostgREST queries from reading ip_hash
REVOKE SELECT ON public.community_submissions FROM anon, authenticated;
GRANT SELECT (
    id,
    kind,
    name,
    category,
    description,
    city,
    address,
    lat,
    lon,
    url,
    contact,
    status,
    created_at,
    event_start,
    event_end
) ON public.community_submissions TO anon, authenticated;

-- Enforce length limits and Czechia geographic coordinate bounds
ALTER TABLE public.community_submissions
    DROP CONSTRAINT IF EXISTS chk_community_submissions_name_len,
    DROP CONSTRAINT IF EXISTS chk_community_submissions_category_len,
    DROP CONSTRAINT IF EXISTS chk_community_submissions_description_len,
    DROP CONSTRAINT IF EXISTS chk_community_submissions_city_len,
    DROP CONSTRAINT IF EXISTS chk_community_submissions_address_len,
    DROP CONSTRAINT IF EXISTS chk_community_submissions_url_len,
    DROP CONSTRAINT IF EXISTS chk_community_submissions_contact_len,
    DROP CONSTRAINT IF EXISTS chk_community_submissions_lat_cz,
    DROP CONSTRAINT IF EXISTS chk_community_submissions_lon_cz,
    DROP CONSTRAINT IF EXISTS chk_community_submissions_event_dates;

ALTER TABLE public.community_submissions
    ADD CONSTRAINT chk_community_submissions_name_len
        CHECK (char_length(name) BETWEEN 2 AND 120),
    ADD CONSTRAINT chk_community_submissions_category_len
        CHECK (char_length(category) BETWEEN 1 AND 80),
    ADD CONSTRAINT chk_community_submissions_description_len
        CHECK (char_length(description) BETWEEN 1 AND 600),
    ADD CONSTRAINT chk_community_submissions_city_len
        CHECK (city IS NULL OR char_length(city) <= 80),
    ADD CONSTRAINT chk_community_submissions_address_len
        CHECK (address IS NULL OR char_length(address) <= 250),
    ADD CONSTRAINT chk_community_submissions_url_len
        CHECK (url IS NULL OR char_length(url) <= 280),
    ADD CONSTRAINT chk_community_submissions_contact_len
        CHECK (contact IS NULL OR char_length(contact) <= 300),
    ADD CONSTRAINT chk_community_submissions_lat_cz
        CHECK (lat IS NULL OR (lat BETWEEN 48.0 AND 51.5)),
    ADD CONSTRAINT chk_community_submissions_lon_cz
        CHECK (lon IS NULL OR (lon BETWEEN 11.5 AND 19.5)),
    ADD CONSTRAINT chk_community_submissions_event_dates
        CHECK (event_start IS NULL OR event_end IS NULL OR event_end >= event_start);

-- ----------------------------------------------------------------------------
-- 2. Table: feedback — enforce status = 'new' and message length bounds
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow anonymous feedback insert" ON public.feedback;
CREATE POLICY "Allow anonymous feedback insert" ON public.feedback
    FOR INSERT TO anon
    WITH CHECK (
        status = 'new'
        AND char_length(message) BETWEEN 1 AND 1500
    );

-- ----------------------------------------------------------------------------
-- 3. Table: pulse_events — 24h public read window and action_id length CHECK
-- ----------------------------------------------------------------------------
ALTER TABLE public.pulse_events
    DROP CONSTRAINT IF EXISTS chk_pulse_events_action_id_len;

ALTER TABLE public.pulse_events
    ADD CONSTRAINT chk_pulse_events_action_id_len
        CHECK (char_length(action_id) BETWEEN 1 AND 80);

DROP POLICY IF EXISTS "Allow public read pulse events" ON public.pulse_events;
CREATE POLICY "Allow public read pulse events" ON public.pulse_events
    FOR SELECT TO anon, authenticated
    USING (created_at >= NOW() - INTERVAL '24 hours');

DROP POLICY IF EXISTS "Allow anonymous insert pulse events" ON public.pulse_events;
CREATE POLICY "Allow anonymous insert pulse events" ON public.pulse_events
    FOR INSERT TO anon
    WITH CHECK (
        char_length(action_id) BETWEEN 1 AND 80
        AND kind IN ('click', 'completed')
        AND (city IS NULL OR char_length(city) <= 60)
    );

COMMIT;
