# Ultra Lab 🏃

**Az ultrafutás legmélyebb tudása egy helyen.**

Backyard Ultra és trail ultra tudástár, top futók interjúiból automatikusan generált cikkekkel.

## Tech Stack

- **Next.js 14** + TypeScript + App Router
- **Supabase** – adatbázis + auth
- **Tailwind CSS** – stílusok
- **next-intl** – HU/EN kétnyelvűség
- **Claude Haiku** – cikk generálás
- **YouTube Transcript API** – ingyenes felirat letöltés
- **GitHub Actions** – napi automatikus pipeline ($0)
- **Vercel** – hosting ($0)

## Gyors indítás

```bash
git clone https://github.com/hegedus21/ultra-lab
cd ultra-lab
npm install
cp .env.example .env.local
# töltsd ki a .env.local fájlt
npm run dev
```

## Supabase setup

1. Hozz létre új projektet: https://supabase.com
2. SQL editor → futtasd le: `supabase/schema.sql`
3. Másold ki a Project URL és anon key értékeket → `.env.local`

## Content Pipeline futtatása

```bash
npm run pipeline
```

Vagy automatikusan minden nap reggel 6-kor GitHub Actions fut (lásd `.github/workflows/pipeline.yml`).

## GitHub Actions secrets

A repo Settings → Secrets and variables → Actions menüpontban add hozzá:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `YOUTUBE_API_KEY` (opcionális)

## Deploy Vercel-re

```bash
npx vercel --prod
```

URL: `ultra-lab.vercel.app`

## Figyelt YouTube csatornák

| Csatorna | Nyelv |
|---|---|
| Backyard Ultra Podcast | EN |
| Nikolay Kotenkov | RU |
| Kirill Tsvetkov | RU |
| Rich Roll | EN |
| Diary of a CEO | EN |
