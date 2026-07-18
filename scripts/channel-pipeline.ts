#!/usr/bin/env tsx
/**
 * Ultra Lab – Napi Csatorna Pipeline v2
 * RSS feed alapú új videó észlelés + YouTube API fallback
 * Minden nap reggel automatikusan fut GitHub Actions-szel
 */

import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"
import { sendArticleReviewEmail } from '../src/lib/email'
import { getTranscript, getVideoDate } from '../src/lib/youtube'

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

const SEGMENT_SIZE = 45000
const MAX_NEW_PER_RUN = 1
const MIN_TRANSCRIPT = 5000
const MIN_DURATION_SEC = 40 * 60

const RELEVANT = [
  'ultra', 'marathon', 'maraton', 'backyard', 'trail', 'running', 'futás', 'futó',
  'бег', 'ультра', 'марафон', 'трейл', 'бэкъярд', 'endurance', 'kitartás', 'ironman',
  'nutrition', 'táplálkozás', 'питание', 'training', 'edzés', 'тренировка',
  'mental', 'mentális', 'mitochondria', 'митохондрии', 'race', 'verseny',
  'spartatlon', 'balaton', '100km', '100 km', '100 mile', 'health', 'egészség', 'здоровье',
  'biotropika',
]
const IRRELEVANT = ['#short', 'shorts', 'clip', 'promo', 'trailer', 'teaser']

function isRelevant(title: string): boolean {
  const l = title.toLowerCase()
  if (IRRELEVANT.some(k => l.includes(k))) return false
  return RELEVANT.some(k => l.includes(k))
}

function langLabel(lang: string) {
  return lang === 'ru' ? 'orosz' : lang === 'hu' ? 'magyar' : 'angol'
}

function slugify(text: string, videoId: string): string {
  return text.toLowerCase()
    .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i').replace(/[óòöôő]/g, 'o').replace(/[úùüûű]/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 60).replace(/^-/, '') + '-' + videoId
}

// RSS feed alapú lekérés – real-time, nincs API kvóta
async function getVideosFromRSS(channelId: string): Promise<{ videoId: string, title: string, publishedAt: string }[]> {
  try {
    // Ha handle (nem UC...), próbáljuk megszerezni a channel ID-t
    let cid = channelId
    if (!channelId.startsWith('UC')) {
      const apiKey = process.env.YOUTUBE_API_KEY
      if (apiKey) {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?forHandle=${channelId}&part=id&key=${apiKey}`)
        const data = await res.json()
        cid = data.items?.[0]?.id || channelId
      }
    }

    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${cid}`
    const res = await fetch(rssUrl, { headers: { 'User-Agent': 'Ultra-Lab-Bot/1.0' } })
    if (!res.ok) return []

    const xml = await res.text()
    const entries: { videoId: string, title: string, publishedAt: string }[] = []

    // Egyszerű XML parse regex-szel
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
    let match
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1]
      const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)
      const titleMatch = entry.match(/<title>([^<]+)<\/title>/)
      const publishedMatch = entry.match(/<published>([^<]+)<\/published>/)

      if (videoIdMatch && titleMatch) {
        entries.push({
          videoId: videoIdMatch[1],
          title: titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'"),
          publishedAt: publishedMatch?.[1] || new Date().toISOString(),
        })
      }
    }
    return entries
  } catch (e) {
    return []
  }
}

// YouTube API fallback ha RSS nem működik
async function getVideosFromAPI(channelId: string, apiKey: string): Promise<{ videoId: string, title: string, publishedAt: string }[]> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&maxResults=15&order=date&type=video&part=snippet&key=${apiKey}`
  )
  const data = await res.json()
  return (data.items || []).map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    publishedAt: item.snippet.publishedAt,
  }))
}

async function getVideoDuration(videoId: string, apiKey: string): Promise<number> {
  if (!apiKey) return 9999
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${apiKey}`)
    const data = await res.json()
    const d = data.items?.[0]?.contentDetails?.duration || 'PT0S'
    const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    return m ? (parseInt(m[1] || '0')) * 3600 + (parseInt(m[2] || '0')) * 60 + (parseInt(m[3] || '0')) : 0
  } catch { return 0 }
}

async function extractKeyFacts(client: Anthropic, segment: string, n: number, total: number, lang: string): Promise<string> {
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001", max_tokens: 800,
    messages: [{
      role: "user",
      content: `Ultrafutós interjú ${n}/${total}. rész (${langLabel(lang)}).
Emeld ki: számok, edzésmódszerek, táplálkozás, felszerelés, mentális technikák, személyes történetek.
Ha van egy erős, idézhető mondat, másold ki szó szerint "IDÉZET:" előtaggal.
Csak azt írd le, amiről a szövegben ténylegesen szó esik – ne egészítsd ki, ne találj ki új tényeket vagy számokat.
Max 350 szó, csak konkrétumok.\n\n${segment}`
    }]
  })
  return res.content[0].type === 'text' ? res.content[0].text : ''
}

async function generateArticle(client: Anthropic, transcript: string, title: string, lang: string): Promise<any> {
  const segments: string[] = []
  for (let i = 0; i < transcript.length; i += SEGMENT_SIZE) segments.push(transcript.slice(i, i + SEGMENT_SIZE))
  console.log(`   📊 ${transcript.length.toLocaleString()} kar → ${segments.length} szegmens`)

  const facts: string[] = []
  for (let i = 0; i < segments.length; i++) {
    process.stdout.write(`   🔍 ${i + 1}/${segments.length}... `)
    facts.push(`=== ${i + 1}. RÉSZ ===\n` + await extractKeyFacts(client, segments[i], i + 1, segments.length, lang))
    console.log('✅')
    await new Promise(r => setTimeout(r, 500))
  }

  process.stdout.write('   ✍️  Cikk... ')
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001", max_tokens: 8000,
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
  "excerpt_hu": "2-3 mondat",
  "excerpt_en": "2-3 sentences",
  "content_hu": "min 600 szó ## alcímekkel **kiemelésekkel**",
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
  catch { return { title_hu: title, title_en: title, excerpt_hu: '', excerpt_en: '', content_hu: '', content_en: '', topics: ['training'], level: 'advanced', runner_name: null } }
}

const VALID_TOPICS = ["backyard_ultra", "nutrition", "training", "mental", "sleep", "gear", "race_strategy", "recovery"]

async function main() {
  console.log(`\n🏃 Ultra Lab – Napi Pipeline v2`)
  console.log(`📅 ${new Date().toLocaleDateString('hu-HU')} | Max ${MAX_NEW_PER_RUN} új cikk`)
  console.log(`📡 RSS feed + YouTube API\n` + '='.repeat(60))

  const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY"]
  const missing = required.filter(k => !process.env[k])
  if (missing.length) { console.error('❌ Hiányzó env:', missing.join(', ')); process.exit(1) }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const apiKey = process.env.YOUTUBE_API_KEY || ''

  const { data: sources } = await db.from('sources').select('*').eq('active', true)
  if (!sources?.length) { console.log('Nincs aktív forrás.'); return }

  console.log(`📺 ${sources.length} csatorna figyelése`)
  let newArticles = 0

  for (const source of sources) {
    if (newArticles >= MAX_NEW_PER_RUN) break
    console.log(`\n📺 ${source.name}`)

    // RSS-sel próbáljuk először (gyorsabb, nincs API kvóta)
    let videos = await getVideosFromRSS(source.channel_id)
    if (videos.length === 0 && apiKey) {
      console.log('   RSS üres, API fallback...')
      videos = await getVideosFromAPI(source.channel_id, apiKey)
    }
    console.log(`   ${videos.length} videó az RSS/API-ból`)

    for (const video of videos) {
      if (newArticles >= MAX_NEW_PER_RUN) break

      const { data: existing } = await db.from('articles').select('id')
        .eq('source_url', `https://www.youtube.com/watch?v=${video.videoId}`).single()
      if (existing) continue

      if (!isRelevant(video.title)) {
        console.log(`   ⏭  Nem releváns: ${video.title.slice(0, 60)}`)
        continue
      }

      const duration = await getVideoDuration(video.videoId, apiKey)
      const durationMin = Math.round(duration / 60)
      if (duration > 0 && duration < MIN_DURATION_SEC) {
        console.log(`   ⏭  Rövid (${durationMin} perc): ${video.title.slice(0, 50)}`)
        continue
      }

      console.log(`\n   🎯 ${video.title.slice(0, 70)} (${durationMin > 0 ? durationMin + ' perc' : '?'})`)

      process.stdout.write('   📄 Felirat... ')
      const transcriptData = await getTranscript(video.videoId)
      if (!transcriptData || transcriptData.text.length < MIN_TRANSCRIPT) {
        console.log('❌ Nincs/rövid felirat')
        continue
      }
      console.log(`✅ ${transcriptData.text.length.toLocaleString()} kar`)

      let generated: any
      try {
        generated = await generateArticle(claude, transcriptData.text, video.title, transcriptData.lang)
        console.log(`   ✅ "${generated.title_hu}"`)
      } catch (err: any) { console.log(`   ❌ ${err.message}`); continue }

      if (!generated.content_hu || generated.content_hu.length < 100) {
        console.log('   ❌ Üres tartalom'); continue
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

      if (dbErr) { console.log(`   ❌ DB: ${dbErr.message}`); continue }
      console.log('   ✅ Mentve → /ai')

      process.stdout.write('   📧 Email... ')
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

      await db.from('sources').update({ last_checked: new Date().toISOString() }).eq('id', source.id)
      newArticles++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`\n✅ Kész! ${newArticles} új cikk generálva.\n`)
}

main().catch(err => { console.error('\n❌', err.message); process.exit(1) })
