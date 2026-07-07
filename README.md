# Ultra Lab 🏃

**Az ultrafutás legmélyebb tudása egy helyen.**

Backyard Ultra és trail ultra tudástár, top futók interjúiból automatikusan generált cikkekkel.

**URL:** https://ultra-lab-eight.vercel.app

---

## Tech Stack

- **Next.js 14** + TypeScript + App Router
- **Supabase** — adatbázis (cikkek, csatornák)
- **Tailwind CSS** — stílusok
- **Claude Haiku** — AI cikk generálás
- **YouTube Transcript API** — ingyenes felirat letöltés
- **Resend** — email értesítések
- **GitHub Actions** — napi automatikus pipeline
- **Vercel** — hosting (ingyenes)

---

## Projekt struktúra

```
ultra-lab/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Főoldal
│   │   ├── ai/                   # AI szekció (Supabase cikkek)
│   │   ├── cikkek/               # Tudástár (markdown cikkek)
│   │   └── rolunk/               # Rólunk oldal
│   ├── components/               # Újrafelhasználható komponensek
│   └── lib/                      # Segédfüggvények (youtube, claude, email)
├── content/
│   └── articles/
│       └── hu/                   # Magyar szerkesztett cikkek (.md)
├── public/
│   └── images/                   # Cikkekhez tartozó képek
├── scripts/
│   ├── process-links.ts          # Konkrét YouTube linkek feldolgozása
│   ├── channel-pipeline.ts       # Napi csatorna pipeline (RSS alapú)
│   └── bulk-channel-import.ts    # Tömeges csatorna feldolgozás
├── .github/
│   └── workflows/
│       └── pipeline-daily.yml    # GitHub Actions napi futtatás
└── supabase/
    └── schema.sql                # Adatbázis séma
```

---

## Tartalom típusok

### 1. AI szekció (`/ai`)

Automatikusan generált cikkek YouTube interjúkból. Claude Haiku generálja,
nincs szerkesztve. Megjelennek az `/ai` oldalon.

### 2. Tudástár (`/cikkek`)

Szerkesztett, validált cikkek markdown fájlokban (`content/articles/hu/`).
Ezek a főoldalon és a `/cikkek` oldalon jelennek meg.

---

## Szerkesztett cikk publikálása (Tudástár)

### Lépések:

**1. Markdown fájl létrehozása**

Hozz létre egy új `.md` fájlt: `content/articles/hu/SLUG.md`

```markdown
---
title: "Cikk címe"
slug: "cikk-slug-url-baratsagos"
excerpt: "Rövid összefoglaló 1-2 mondatban."
date: "2026-07-08"
athlete: "Futó Neve"
athleteCountry: "hu"
sourceLang: "ru"
raceTypes: ["backyard-ultra"]
topics: ["mentalis-strategia", "felkeszules"]
level: "elit"
loopNumber: 2
coverImage: "/images/kep-neve.jpg"
---

![Képaláírás](/images/kep-neve.jpg)

Cikk tartalma markdown formátumban...

## Alcím

Szöveg **kiemeléssel** és _dőlt betűvel_.

- Lista elem 1
- Lista elem 2

> Idézet a futótól
```

**2. Frontmatter értékek**

`raceTypes` lehetséges értékek:

- `backyard-ultra` — Backyard Ultra
- `100-mile` — 100 mérföld
- `100k` — 100 km
- `50k` — 50 km
- `multiday` — Többnapos verseny
- `trail-general` — Általános trail/ultra

`topics` lehetséges értékek:

- `mentalis-strategia` — Mentális stratégia
- `felkeszules` — Felkészülés
- `taplalkozas` — Táplálkozás
- `alvasmenedzsment` — Alvásmenedzsment
- `felszereles` — Felszerelés
- `serulesmegelozes` — Sérülésmegelőzés
- `versenynapi-taktika` — Versenynapi taktika
- `regeneracio` — Regeneráció

`level` lehetséges értékek: `kezdo`, `halado`, `elit`

**3. Képek elhelyezése**

Képeket a `public/images/` mappába kell másolni.
A markdown fájlban így hivatkozol rájuk: `/images/fajlnev.jpg`

**4. Publikálás**

```bash
git add .
git commit -m "cikk: Futó neve - cikk témája"
git push
```

Vercel automatikusan deploy-ol, ~1 perc és él az éles oldalon.

---

## Konkrét YouTube link feldolgozása

Ha egy konkrét videót akarsz feldolgozni AI cikké:

**1.** Nyisd meg a `scripts/process-links.ts` fájlt

**2.** Add hozzá a linket a `YOUTUBE_LINKS` tömbhöz:

```typescript
const YOUTUBE_LINKS = [
  // ... meglévők ...
  "https://www.youtube.com/watch?v=VIDEOID",
];
```

**3.** Futtasd:

```bash
npx tsx scripts/process-links.ts
```

A script automatikusan kihagyja a már feldolgozott videókat, csak az újakat dolgozza fel.

---

## Új csatorna hozzáadása

Ha egy új YouTube csatornát szeretnél felvenni a rendszerbe, futtasd ezt
a Supabase SQL Editorban:

```sql
INSERT INTO sources (name, url, channel_id, language) VALUES
  ('Csatorna neve', 'https://www.youtube.com/@handle', 'channel_handle', 'hu');
```

**language** értékek: `hu`, `en`, `ru`

A csatorna ezután automatikusan bekerül a napi pipeline-ba és a bulk import-ba is.

---

## Pipeline scriptek

### `channel-pipeline.ts` — Napi automatikus pipeline

**Mikor fut:** Minden nap reggel 7:00 (magyar idő) GitHub Actions-szel.

**Mit csinál:**

1. Végigmegy az összes aktív csatornán (Supabase `sources` tábla)
2. RSS feed alapján lekéri a legújabb ~15 videót csatornánként
3. Ha RSS nem működik → YouTube API fallback
4. Minden videónál ellenőrzi:
   - Már fel van-e dolgozva? (ha igen, kihagyja)
   - Releváns-e a téma? (ultrafutás, endurance, egészség, táplálkozás stb.)
   - Legalább 40 perces-e?
5. Naponta **maximum 1 új cikket** generál
6. A cikk megjelenik az `/ai` szekcióban
7. Email értesítés érkezik a teljes markdown tartalommal

**Kézzel is futtatható:**

```bash
npx tsx scripts/channel-pipeline.ts
```

**GitHub Actions kézzel indítható:**
GitHub → Actions → Daily Content Pipeline → Run workflow

---

### `bulk-channel-import.ts` — Tömeges feldolgozás

**Mikor használd:** Egyszeri futtatás ha egy csatorna régi videóit is be akarod tölteni.

**Mit csinál:**

1. YouTube uploads playlist alapján lekéri a csatorna **összes** videóját (max 200)
2. Szűr: releváns téma + 40+ perc + nincs még cikk
3. Szegmentált feldolgozás: akár 4+ órás interjúk is teljes egészében feldolgozódnak
4. Email értesítés minden új cikkről

**Futtatás:**

```bash
# Teszt – csak listázza mit dolgozna fel, nem generál
npx tsx scripts/bulk-channel-import.ts --dry-run

# Éles – maximum 20 videó feldolgozása
npx tsx scripts/bulk-channel-import.ts --max 20

# Csak egy konkrét csatorna
npx tsx scripts/bulk-channel-import.ts --max 50 --channel MozgasvilagHungary

# Kombinálva
npx tsx scripts/bulk-channel-import.ts --max 10 --channel richroll
```

**Ajánlott sorrend új csatornánál:**

1. Add hozzá a csatornát a Supabase `sources` táblához
2. Futtasd: `npx tsx scripts/bulk-channel-import.ts --max 20 --channel HANDLE`
3. Ellenőrizd az `/ai` oldalon a generált cikkeket
4. Ettől kezdve a napi pipeline automatikusan figyeli

---

## Figyelt YouTube csatornák

| Csatorna               | Nyelv | Fókusz                           |
| ---------------------- | ----- | -------------------------------- |
| Backyard Ultra Podcast | EN    | Backyard Ultra specifikus        |
| Nikolay Kotenkov       | RU    | Elit ultra tapasztalatok         |
| Kirill Tsvetkov        | RU    | Ultra rekordok, felszerelés      |
| Rich Roll              | EN    | Endurance életmód, interjúk      |
| Diary of a CEO         | EN    | Mentális stratégia, teljesítmény |
| Mozgásvilág Hungary    | HU    | Magyar ultrafutás                |
| Futógondolatok         | HU    | Magyar futós tartalom            |
| Szilágyi Gyula         | HU    | Magyar ultra                     |
| Balatonman             | HU    | Magyar triathlon/ultra           |

---

## Environment Variables

A `.env.local` fájlban (soha ne commitold):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
ANTHROPIC_API_KEY=sk-ant-...
YOUTUBE_API_KEY=AIza...
RESEND_API_KEY=re_...
AI_PUBLISH_SECRET=titkos-string
NEXT_PUBLIC_SITE_URL=https://ultra-lab-eight.vercel.app
```

GitHub Actions-ban ezek Secrets-ként vannak tárolva
(Settings → Secrets and variables → Actions).

---

## Lokális fejlesztés

```bash
git clone https://github.com/hegedus21/ultra-lab
cd ultra-lab
npm install
cp .env.example .env.local
# Töltsd ki a .env.local fájlt
npm run dev
```

Megnyitás: http://localhost:3000

---

## Új téma (topic) hozzáadása

Ha új témakategóriát akarsz felvenni (pl. "versenyeredmények", "pszichológia"):

**1.** Nyisd meg: `src/lib/taxonomy.ts`

**2.** Add hozzá a `Topic` típushoz:

```typescript
export type Topic = "felkeszules" | "taplalkozas" | "uj-tema"; // ← ezt add hozzá
// ...
```

**3.** Add hozzá a `TOPICS` objektumhoz:

```typescript
export const TOPICS: Record<Topic, TaxonomyEntry> = {
  // ... meglévők ...
  "uj-tema": {
    slug: "uj-tema",
    labelHu: "Új téma neve",
    labelEn: "New Topic Name",
    description: "Rövid leírás.",
  },
};
```

**4.** Push — a téma automatikusan megjelenik a `/cikkek` oldal szűrőjében.

---

## Új versenytípus (raceType) hozzáadása

Ugyanígy a `RaceType` típushoz és a `RACE_TYPES` objektumhoz:

```typescript
export type RaceType = "backyard-ultra" | "uj-verseny"; // ← ezt add hozzá

export const RACE_TYPES: Record<RaceType, TaxonomyEntry> = {
  // ...
  "uj-verseny": {
    slug: "uj-verseny",
    labelHu: "Új verseny típus",
    labelEn: "New Race Type",
    description: "Leírás.",
  },
};
```

---

## A `loopNumber` mező magyarázata

A `loopNumber` a cikk sorszáma a tudástáron belül — "hányadik kör".
Ez a Backyard Ultra metaforára épül: minden szerkesztett cikk egy újabb kört jelent.

- Az első szerkesztett cikked: `loopNumber: 1`
- A második: `loopNumber: 2`
- És így tovább...

Ez a szám megjelenik a cikk oldalán: **"01. cikk a tudástárban"**

---

## Cikk szerkesztési workflow (AI → Tudástár)

Ha egy AI cikket szeretnél szerkeszteni és a Tudástárba emelni:

1. Nyisd meg az `/ai` szekciót és keresd meg a cikket
2. Kattints a **"▶ Forrás"** linkre — hallgasd meg/nézd meg az eredeti interjút
3. Nyisd meg az AI cikket és szerkeszd:
   - Töröld az általánosságokat
   - Add hozzá a konkrét számokat, adatokat
   - Írj személyes véleményt, kontextust a magyar közösségnek
   - Emeld ki a legfontosabb tanulságokat
4. Hozz létre új `.md` fájlt `content/articles/hu/` mappában
5. Tölts fel képet `public/images/` mappába
6. Push → megjelenik a Tudástárban

**Ökölszabály:** Ha valami konkrét adat (szám, módszer, szabály) benne van az interjúban de az AI kihagyta — az a legértékesebb kiegészítés.

---

## Hasznos parancsok

```bash
# Lokális fejlesztés indítása
npm run dev

# Konkrét videók feldolgozása
npx tsx scripts/process-links.ts

# Napi pipeline kézzel
npx tsx scripts/channel-pipeline.ts

# Tömeges import (dry-run először!)
npx tsx scripts/bulk-channel-import.ts --dry-run
npx tsx scripts/bulk-channel-import.ts --max 20

# Build ellenőrzés deploy előtt
npm run build
```
