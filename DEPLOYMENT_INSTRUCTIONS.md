# 🚀 Nasazení a databáze (Deployment & Supabase Guide)

Aplikace **Akcelerátor altruismu v2** je postavená na **SvelteKitu** (`akcelerator-landing-page/`) a je navržená tak, aby fungovala **okamžitě i bez externí databáze** (má vestavěný in-memory a kurátorovaný český fallback). Pokud připojíš Supabase, zpětná vazba a komunitní tipy se budou trvale ukládat do PostgreSQL.

---

## 1. Nasazení na Vercel

1. V administraci Vercelu nastav:
   - **Root Directory**: `akcelerator-landing-page`
   - **Framework Preset**: `SvelteKit`
   - **Build Command**: `npm run build`
2. (Volitelné) Nastav Environment Variables:
   - `PUBLIC_SUPABASE_URL` = `https://<tvuj-projekt>.supabase.co`
   - `PUBLIC_SUPABASE_ANON_KEY` = `<tvuj-public-anon-key>`

---

## 2. Volitelné nastavení Supabase (SQL schéma)

Pokud chceš ukládat zpětnou vazbu a komunitní tipy do nového projektu v Supabase, spusť v **Supabase SQL Editoru** tento skript:

```sql
-- 1. Tabulka pro anonymní zpětnou vazbu
CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text TEXT NOT NULL,
    emotion TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous feedback insert" ON feedback
    FOR INSERT TO anon WITH CHECK (true);

-- 2. Tabulka pro komunitní tipy na organizace a akce (/submit -> /near)
CREATE TABLE IF NOT EXISTS community_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    kind TEXT NOT NULL CHECK (kind IN ('org', 'event')),
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    address_label TEXT,
    city TEXT,
    postcode TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    event_url TEXT,
    event_start TIMESTAMP WITH TIME ZONE,
    event_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE community_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous submission insert" ON community_submissions
    FOR INSERT TO anon WITH CHECK (status = 'pending');

CREATE POLICY "Allow public read of approved submissions" ON community_submissions
    FOR SELECT TO anon USING (status = 'approved');
```
