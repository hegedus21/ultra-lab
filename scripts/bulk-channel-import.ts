#!/usr/bin/env tsx
/**
 * Ultra Lab – Tömeges csatorna feldolgozó
 * Feldolgozza az összes csatorna összes meglévő videóját
 * Használat: npx tsx scripts/bulk-channel-import.ts
 * 
 * Opciók:
 *   --max 50        Max feldolgozandó videó (default: 50)
 *   --channel xyz   Csak egy csatorna (channel_id)
 *   --dry-run       Csak listázza, nem generál
 
# Első teszt – 5 videó dry run módban (nem generál, csak listáz)
npx tsx scripts/bulk-channel-import.ts --max 5 --dry-run

# Éles futtatás – 20 videó
npx tsx scripts/bulk-channel-import.ts --max 20

# Csak egy csatorna
npx tsx scripts/bulk-channel-import.ts --max 50 --channel MozgasvilagHungary
 */

import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"
import * as fs from "fs"
import { sendArticleReviewEmail } from '../src/lib/email'
import { getTranscript, getVideoDate } from '../src/lib/youtube'

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

const SEGMENT_SIZE = 45000
const MIN_TRANSCRIPT_LENGTH = 5000  // ~40 perc felirat

// CLI args
const args = process.argv.slice(2)
const MAX_NEW = parseInt(args[args.indexOf('--max') + 1] || '20')
const CHANNEL_FILTER = args[args.indexOf('--channel') + 1] || null
const DRY_RUN = args.includes('--dry-run')

const RELEVANT_KEYWORDS = [
  'ultra', 'marathon', 'maraton', 'backyard', 'trail', 'running', 'futás', 'futó',
  'бег', 'ультра', 'марафон', 'трейл', 'бэкъярд', 'endurance', 'kitartás', 'ironman',
  'nutrition', 'táplálkozás', 'питание', 'training', 'edzés', 'тренировка',
  'mental', 'mentális', 'mitochondria', 'mitokondrium', 'митохондрии',
  'race', 'verseny', 'spartatlon', 'balaton', '100km', '100 km', '100 mile',
  'health', 'egészség', 'здоровье', 'recovery', 'regeneráció', 'biotropika',
]

const IRRELEVANT_KEYWORDS = ['#short', 'shorts', 'clip', 'promo', 'trailer', 'teaser']

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase()
  if (IRRELEVANT_KEYWORDS.some(k => lower.includes(k))) return false
  return RELEVANT_KEYWORDS.some(k => lower.includes(k))
}

function langLabel(lang: string) {
  return lang === 'ru' ? 'orosz' : lang === 'hu' ? 'magyar' : 'angol'
}

function slugify(text: string, videoId: string): string {
  return text.toLowerCase()
    .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i').replace(/[óòöôő]/g, 'o')
    .replace(/[úùüûű]/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-/, '') + '-' + videoId
}

// YouTube uploads playlist alapú lekérés – sokkal több videót ad vissza mint a search
async function getChannelAllVideos(
  channelId: string,
  apiKey: string,
  maxResults = 200
): Promise<{ videoId: string, title: string, publishedAt: string }[]> {
  const videos: { videoId: string, title: string, publishedAt: string }[] = []

  // Először megkeressük az uploads playlist ID-ját
  // Channel ID: UC... → Uploads playlist: UU...
  let uploadsPlaylistId: string

  if (channelId.startsWith('UC')) {
    uploadsPlaylistId = 'UU' + channelId.slice(2)
  } else {
    // Handle alapú csatorna → channel ID lekérés
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?forHandle=${channelId}&part=contentDetails&key=${apiKey}`
    )
    const channelData = await channelRes.json()
    const uploads = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    if (!uploads) {
      // Fallback: search API
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&maxResults=50&order=date&type=video&part=snippet&key=${apiKey}`
      )
      const searchData = await searchRes.json()
      return (searchData.items || []).map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
      }))
    }
    uploadsPlaylistId = uploads
  }

  // Lapozva lekérjük az összes videót
  let pageToken = ''
  while (videos.length < maxResults) {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${uploadsPlaylistId}&maxResults=50&part=snippet${pageToken ? `&pageToken=${pageToken}` : ''}&key=${apiKey}`
    const res = await fetch(url)
    const data = await res.json()

    if (data.error) {
      console.log(`   ⚠️  API hiba: ${data.error.message}`)
      break
    }

    for (const item of (data.items || [])) {
      videos.push({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
      })
    }

    if (!data.nextPageToken || videos.length >= maxResults) break
    pageToken = data.nextPageToken
    await new Promise(r => setTimeout(r, 200))
  }

  return videos
}

async function getVideoDuration(videoId: string, apiKey: string): Promise<number> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${apiKey}`
    )
    const data = await res.json()
    const duration = data.items?.[0]?.contentDetails?.duration || 'PT0S'
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0
    return (parseInt(match[1] || '0')) * 3600 + (parseInt(match[2] || '0')) * 60 + (parseInt(match[3] || '0'))
  } catch { return 0 }
}

async function extractKeyFacts(client: Anthropic, segment: string, n: number, total: number, lang: string): Promise<string> {
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `Ultrafutós interjú ${n}/${total}. része (${langLabel(lang)}).
Emeld ki a legfontosabb konkrét infókat: számok, adatok, edzésmódszerek, táplálkozás, felszerelés, mentális technikák, személyes történetek.
Ha van egy erős, idézhető mondat, másold ki szó szerint "IDÉZET:" előtaggal.
Csak azt írd le, amiről a szövegben ténylegesen szó esik – ne egészítsd ki, ne találj ki új tényeket vagy számokat.
Max 350 szó, csak konkrétumok.

SZÖVEG:
${segment}`
    }]
  })
  return res.content[0].type === 'text' ? res.content[0].text : ''
}

async function generateArticle(client: Anthropic, transcript: string, title: string, lang: string): Promise<any> {
  const segments: string[] = []
  for (let i = 0; i < transcript.length; i += SEGMENT_SIZE) {
    segments.push(transcript.slice(i, i + SEGMENT_SIZE))
  }
  console.log(`      📊 ${transcript.length.toLocaleString()} kar → ${segments.length} szegmens`)

  const facts: string[] = []
  for (let i = 0; i < segments.length; i++) {
    process.stdout.write(`      🔍 ${i + 1}/${segments.length}... `)
    facts.push(`=== ${i + 1}. RÉSZ ===\n` + await extractKeyFacts(client, segments[i], i + 1, segments.length, lang))
    console.log('✅')
    await new Promise(r => setTimeout(r, 500))
  }

  process.stdout.write('      ✍️  Cikk... ')
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8000,
    messages: [{
      role: "user",
      content: `Ultra Lab tudástár szerkesztő vagy. Videó: "${title}" (${langLabel(lang)})

Tények:
${facts.join('\n\n')}

Írj egy magazin-jellegű profilcikket a fenti tényekre támaszkodva.

STÍLUS:
- Nyitó bekezdés: mutasd be a versenyzőt/témát egy konkrét ténnyel, **félkövérrel** kiemelve a nevet és a legfontosabb számot
- ## alcímek tematikusan/időrendben, történetmesélő ívvel – ne csak témák felsorolása legyen
- Ha a Tények közt van "IDÉZET:", emeld ki > blockquote formában
- Konkrét adatokat bullet listákban csoportosítva az adott alcím alatt
- Zárás "## Összefoglalás" szakasszal, **félkövér** bullet listával a legfontosabb tanulságokról

SZIGORÚ SZABÁLYOK:
- Kizárólag a fenti Tények szekcióban szereplő infót használd. Ne találj ki, ne extrapolálj számokat, díjakat, összegeket vagy állításokat, amik nincsenek ott explicit megadva. Bizonytalan adatot inkább hagyj ki.
- A content_hu TISZTÁN magyarul íródjon – ne maradjon benne idegen (angol/orosz/német) szó, ha van rá magyar megfelelő.
- A title_hu legyen konkrét és figyelemfelkeltő, a versenyző nevét és a fő tanulságot/történetet emelje ki – NE statisztika-felsorolás jellegű legyen.
- runner_name mezőbe MINDIG írd be az interjúalany nevét, ha az a tényekből azonosítható.

CSAK JSON-t adj vissza (a stringekben valódi \n sortörésekkel, ne dupla escape-eld), aposztróf idézőjel helyett:
{
  "title_hu": "max 80 kar",
  "title_en": "max 80 chars",
  "excerpt_hu": "2-3 mondat legjobb konkrét részlettel",
  "excerpt_en": "2-3 sentences",
  "content_hu": "min 600 szó, ## alcímekkel, **kiemelésekkel**",
  "content_en": "min 600 words",
  "topics": ["backyard_ultra","nutrition","training","mental","sleep","gear","race_strategy","recovery"],
  "level": "beginner/advanced/elite",
  "runner_name": "név vagy null"
}`
    }]
  })

  const raw = res.content[0].type === 'text' ? res.content[0].text : ''
  let text = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  if (!text.endsWith('}')) {
    const lc = text.lastIndexOf('",\n')
    text = lc > 0 ? text.slice(0, lc + 1) + '\n  "level": "advanced",\n  "runner_name": null\n}' : text + '"}'
  }
  try {
    const parsed = JSON.parse(text)
    // Néha duplán escape-eli a modell a sortöréseket a JSON stringen belül
    if (typeof parsed.content_hu === 'string') parsed.content_hu = parsed.content_hu.replace(/\\n/g, '\n')
    if (typeof parsed.content_en === 'string') parsed.content_en = parsed.content_en.replace(/\\n/g, '\n')
    return parsed
  }
  catch {
    return { title_hu: title, title_en: title, excerpt_hu: '', excerpt_en: '', content_hu: '', content_en: '', topics: ['training'], level: 'advanced', runner_name: null }
  }
}

const VALID_TOPICS = ["backyard_ultra", "nutrition", "training", "mental", "sleep", "gear", "race_strategy", "recovery"]

async function main() {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) { console.error('❌ YOUTUBE_API_KEY hiányzik'); process.exit(1) }

  const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY"]
  const missing = required.filter(k => !process.env[k])
  if (missing.length) { console.error('❌ Hiányzó env:', missing.join(', ')); process.exit(1) }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  console.log(`\n🏃 Ultra Lab – Tömeges csatorna feldolgozó`)
  console.log(`📊 Max: ${MAX_NEW} videó | ${DRY_RUN ? 'DRY RUN' : 'Éles mód'}`)
  console.log('='.repeat(60))

  const { data: sources } = await db.from('sources').select('*').eq('active', true)
  if (!sources?.length) { console.log('Nincs aktív forrás.'); return }

  const filteredSources = CHANNEL_FILTER
    ? sources.filter(s => s.channel_id === CHANNEL_FILTER)
    : sources

  console.log(`📺 ${filteredSources.length} csatorna feldolgozása`)

  let processed = 0
  let skipped = 0
  let noTranscript = 0
  let errors = 0
  const log: string[] = []

  for (const source of filteredSources) {
    console.log(`\n📺 ${source.name} (${source.language})`)

    const videos = await getChannelAllVideos(source.channel_id, apiKey, 200)
    console.log(`   ${videos.length} videó találva a csatornán`)

    for (const video of videos) {
      if (processed >= MAX_NEW) break

      // Már feldolgozva?
      const { data: existing } = await db.from('articles').select('id')
        .eq('source_url', `https://www.youtube.com/watch?v=${video.videoId}`).single()
      if (existing) { skipped++; continue }

      // Releváns?
      if (!isRelevant(video.title)) {
        console.log(`   ⏭  Nem releváns: ${video.title.slice(0, 60)}`)
        skipped++
        continue
      }

      // Időtartam ellenőrzés
      const duration = await getVideoDuration(video.videoId, apiKey)
      const durationMin = Math.round(duration / 60)
      if (duration > 0 && duration < 40 * 60) {
        console.log(`   ⏭  Rövid (${durationMin} perc): ${video.title.slice(0, 50)}`)
        skipped++
        continue
      }

      console.log(`\n   🎯 ${video.title.slice(0, 70)} (${durationMin > 0 ? durationMin + ' perc' : '?'})`)
      console.log(`      📅 ${video.publishedAt.split('T')[0]}`)

      if (DRY_RUN) {
        console.log('      [DRY RUN - kihagyva]')
        log.push(`WOULD PROCESS: ${video.title}`)
        processed++
        continue
      }

      // Felirat
      process.stdout.write('      📄 Felirat... ')
      const transcriptData = await getTranscript(video.videoId)
      if (!transcriptData || transcriptData.text.length < MIN_TRANSCRIPT_LENGTH) {
        console.log(`❌ Nincs/rövid felirat (${transcriptData?.text.length || 0} kar)`)
        noTranscript++
        continue
      }
      console.log(`✅ ${transcriptData.text.length.toLocaleString()} kar (${transcriptData.lang})`)

      // Generálás
      let generated: any
      try {
        generated = await generateArticle(claude, transcriptData.text, video.title, transcriptData.lang)
        console.log(`      ✅ "${generated.title_hu}"`)
      } catch (err: any) {
        console.log(`      ❌ ${err.message}`)
        errors++
        continue
      }

      if (!generated.content_hu || generated.content_hu.length < 100) {
        console.log('      ❌ Üres tartalom')
        errors++
        continue
      }

      const videoDate = video.publishedAt.split('T')[0]
      const validTopics = (generated.topics || []).filter((t: string) => VALID_TOPICS.includes(t))
      const slug = slugify(generated.title_hu || video.title, video.videoId)

      const { error: dbErr } = await db.from('articles').insert({
        slug, title_hu: generated.title_hu, title_en: generated.title_en,
        excerpt_hu: generated.excerpt_hu, excerpt_en: generated.excerpt_en,
        content_hu: generated.content_hu, content_en: generated.content_en,
        topics: validTopics, level: generated.level || 'advanced',
        runner_name: generated.runner_name || null,
        discipline: validTopics.includes('backyard_ultra') ? 'backyard_ultra' : 'trail_ultra',
        status: 'ai_published', published_at: new Date().toISOString(),
        video_date: videoDate, source_url: `https://www.youtube.com/watch?v=${video.videoId}`,
        source_type: 'youtube',
      })

      if (dbErr) { console.log(`      ❌ DB: ${dbErr.message}`); errors++; continue }

      process.stdout.write('      📧 Email... ')
      try {
        await sendArticleReviewEmail({
          videoId: video.videoId, videoTitle: video.title,
          title_hu: generated.title_hu, title_en: generated.title_en,
          excerpt_hu: generated.excerpt_hu, excerpt_en: generated.excerpt_en,
          content_hu: generated.content_hu, content_en: generated.content_en,
          topics: validTopics, level: generated.level || 'advanced',
          runner_name: generated.runner_name || null,
          source_url: `https://www.youtube.com/watch?v=${video.videoId}`, slug,
        })
        console.log('✅')
      } catch (e: any) { console.log(`⚠️  ${e.message}`) }

      log.push(`OK: ${generated.title_hu}`)
      processed++
      await new Promise(r => setTimeout(r, 2000))
    }

    if (processed >= MAX_NEW) {
      console.log('\n✋ Maximum elérve, megállás.')
      break
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`\n✅ Kész!`)
  console.log(`   Feldolgozva: ${processed}`)
  console.log(`   Kihagyva:    ${skipped}`)
  console.log(`   Nincs felir: ${noTranscript}`)
  console.log(`   Hiba:        ${errors}`)

  if (log.length) {
    fs.writeFileSync('bulk-import-results.txt', log.join('\n'))
    console.log('\n📄 Napló: bulk-import-results.txt')
  }
}

main().catch(err => { console.error('\n❌', err.message); process.exit(1) })
