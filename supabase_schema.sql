-- supabase_schema.sql
-- Fichier d'initialisation de la base de données pour LiveBoard

-- ==========================================
-- 1. CREATION DES TABLES
-- ==========================================

CREATE TABLE participants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  category     TEXT NOT NULL,
  age_category TEXT NOT NULL DEFAULT 'U18',
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  UUID REFERENCES participants(id) ON DELETE CASCADE,
  value           INTEGER NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  recorded_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sponsors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  media_url       TEXT NOT NULL,
  media_type      TEXT NOT NULL, -- "image" | "video"
  display_order   INTEGER NOT NULL,
  duration_sec    INTEGER DEFAULT 5,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name            TEXT DEFAULT 'LiveBoard',
  carousel_interval_min INTEGER DEFAULT 3,
  carousel_duration_sec INTEGER DEFAULT 15,
  display_mode          TEXT DEFAULT 'all', -- "all" | "sponsors_only" | "ranking_only"
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Insertion de la ligne de configuration par défaut
INSERT INTO settings (id) VALUES (gen_random_uuid());

-- ==========================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture (Publique)
CREATE POLICY "Lecture publique des participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Lecture publique des scores" ON scores FOR SELECT USING (true);
CREATE POLICY "Lecture publique des sponsors" ON sponsors FOR SELECT USING (true);
CREATE POLICY "Lecture publique des paramètres" ON settings FOR SELECT USING (true);

-- Politiques d'écriture (Accès réservé aux administrateurs authentifiés)
CREATE POLICY "Modifications participants par admin" ON participants FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Modifications scores par admin" ON scores FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Modifications sponsors par admin" ON sponsors FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Modifications paramètres par admin" ON settings FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 3. TEMPS RÉEL (REALTIME)
-- ==========================================

-- Exposer les tables nécessaires via l'API Realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE participants, scores, sponsors, settings;

-- ==========================================
-- 4. BUCKET DE STOCKAGE (STORAGE)
-- ==========================================

-- Création du bucket public "sponsors-media"
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sponsors-media', 'sponsors-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS pour le bucket de stockage
-- Lecture publique des fichiers
CREATE POLICY "Lecture publique des médias sponsors" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'sponsors-media');

-- Écriture (Ajout, Modif, Suppression) réservée aux admins
CREATE POLICY "Uploads médias par admin" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'sponsors-media' AND auth.role() = 'authenticated');

CREATE POLICY "Modifications médias par admin" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'sponsors-media' AND auth.role() = 'authenticated');

CREATE POLICY "Suppressions médias par admin" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'sponsors-media' AND auth.role() = 'authenticated');
