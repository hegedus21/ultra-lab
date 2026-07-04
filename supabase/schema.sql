-- Ultra Lab – Supabase Schema
-- Futtasd le a Supabase SQL editor-ban

-- Articles (cikkek)
CREATE TABLE IF NOT EXISTS articles (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug          text UNIQUE NOT NULL,
  title_hu      text,
  title_en      text,
  excerpt_hu    text,
  excerpt_en    text,
  content_hu    text,
  content_en    text,
  discipline    text DEFAULT 'backyard_ultra',
  topics        text[] DEFAULT '{}',
  level         text DEFAULT 'advanced',
  status        text DEFAULT 'draft' CHECK (status IN ('draft','review','published')),
  source_url    text,
  source_type   text DEFAULT 'youtube',
  runner_name   text,
  cover_image   text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  published_at  timestamptz
);

-- Runners (futók profilja)
CREATE TABLE IF NOT EXISTS runners (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name             text NOT NULL,
  country          text,
  bio_hu           text,
  bio_en           text,
  achievements     text[] DEFAULT '{}',
  backyard_record  integer,
  photo            text,
  created_at       timestamptz DEFAULT now()
);

-- Sources (YouTube csatornák)
CREATE TABLE IF NOT EXISTS sources (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL,
  type          text DEFAULT 'youtube_channel',
  url           text NOT NULL,
  channel_id    text NOT NULL,
  language      text DEFAULT 'en',
  last_checked  timestamptz,
  active        boolean DEFAULT true
);

-- Insert az 5 YouTube csatorna
INSERT INTO sources (name, url, channel_id, language) VALUES
  ('Backyard Ultra Podcast', 'https://www.youtube.com/@Backyardultrapodcast', 'Backyardultrapodcast', 'en'),
  ('Nikolay Kotenkov',       'https://www.youtube.com/@NIKOLAY_KOTENKOV',    'NIKOLAY_KOTENKOV',    'ru'),
  ('Kirill Tsvetkov',        'https://www.youtube.com/@kirill_tsvet_kov',     'kirill_tsvet_kov',    'ru'),
  ('Rich Roll',              'https://www.youtube.com/@richroll',             'richroll',            'en'),
  ('Diary of a CEO',         'https://www.youtube.com/@TheDiaryOfACEO',       'TheDiaryOfACEO',      'en')
ON CONFLICT DO NOTHING;

-- RLS policies (Row Level Security)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE runners  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources  ENABLE ROW LEVEL SECURITY;

-- Publikus olvasás a published cikkekhez
CREATE POLICY "Public can read published articles"
  ON articles FOR SELECT
  USING (status = 'published');

-- Service role mindent tud
CREATE POLICY "Service role full access articles"
  ON articles FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access sources"
  ON sources FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Public can read runners"
  ON runners FOR SELECT USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
