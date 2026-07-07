#!/usr/bin/env tsx
/**
 * Ultra Lab – Csatorna Pipeline
 * Napi automatikus futtatás GitHub Actions-szel
 * Naponta MAX 1 új cikket generál, csak releváns, 40+ perces videókból
 */

import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"
import { sendArticleReviewEmail } from '../src/lib/email'
import { getTranscript, getVideoDate } from '../src/lib/youtube'

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

const SEGMENT_SIZE = 45000
const MAX_NEW_ARTICLES_PER_RUN = 1
const MIN_VIDEO_DURATION_SECONDS = 40 * 60  // 40 perc

// Releváns témák kulcsszavai (videó cím ellenőrzéshez)
const RELEVANT_KEYWORDS = [
  // Futás
  'ultra', 'marathon', 'maraton', 'backyard', 'trail', 'running', 'futás', 'futó',
  'bieg', 'бег', 'ультра', 'марафон', 'трейл',
  // Teljesítmény / egészség
  'endurance', 'kitartás', 'állóképesség', 'ironman', 'triathlon',
  'nutrition', 'táplálkozás', 'питание',
  'recovery', 'regeneráció', 'восстановление',
  'training', 'edzés', 'тренировка',
  'mental', 'mentális', 'психология',
  'mitochondria', 'mitokondrium', 'митохондрии',
  'hypoxia', 'hipoxia', 'гипоксия',
  // Versenyek
  'race', 'verseny', 'соревнование', 'spartatlon', 'spartathlon',
  'balaton', 'ultrabalaton', '100km', '100 km', '100 mile', '100 mérföld',
  // Egészség / kutatás
  'health', 'egészség', 'здоровье', 'research', 'study', 'kutatás',
]

const IRRELEVANT_KEYWORDS = [
  'shorts', '#short', 'clip', 'highlight', 'promo', 'reklám',
  'teaser', 'trailer', 'announcement',
]

function isRelevantTitle(title: string): boolean {
  const lower = title.toLowerCase()
  if (IRRELEVANT_KEYWORDS.some(kw => lower.includes(kw))) return false
  return RELEVANT_KEYWORDS.some(kw => lower.includes(kw))
}

function langLabel(lang: string): string {
  if (lang === 'ru') return 'orosz'
  if (lang === 'hu') return 'magyar'
  return 'angol'
}

function slugify(text: string, videoId: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[áàäâ]/g, "a").replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i").replace(/[óòöôő]/g, "o")
    .replace(/[úùüûű]/g, "u")
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
    .slice(0, 60)
  return `${slug}-${videoId}`.replace(/^-/, "")
}

async function getChannelVideos(channelId: string, maxResults = 10): Promise<any[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    console.log("   ⚠️  YOUTUBE_API_KEY hiányzik, csatorna kihagyva")
    return []
  }
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&part=snippet&key=${apiKey}`
  )
  const data = await res.json()
  if (!data.items) return []
  return data.items.map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    publishedAt: item.snippet.publishedAt,
  }))
}

async function getVideoDuration(videoId: string): Promise<number> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return 9999  // Ha nincs API kulcs, ne szűrjük ki
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${apiKey}`
    )
    const data = await res.json()
    const duration = data.items?.[0]?.contentDetails?.duration || 'PT0S'
    // ISO 8601 duration parse: PT1H23M45S
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0
    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')
    return hours * 3600 + minutes * 60 + seconds
  } catch {
    return 0
  }
}

async function extractKeyFacts(client: Anthropic, segment: string, segNum: number, total: number, lang: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `Ez egy ultrafutós/endurance sport interjú ${segNum}/${total}. része (${langLabel(lang)} nyelven).

Emeld ki a LEGFONTOSABB konkrét információkat:
- Konkrét számok, adatok, távolságok, tempók
- Edzésmódszerek, napi/heti rutinok
- Táplálkozás, felszerelés, mentális technikák
- Személyes történetek, fordulópontok, eredmények

Max 350 szó, csak konkrétumok.

SZÖVEG:
${segment}`
    }]
  })
  return response.content[0].type === 'text' ? response.content[0].text : ''
}

async function generateArticle(client: Anthropic, transcript: string, title: string, lang: string): Promise<any> {
  const segments: string[] = []
  for (let i = 0; i < transcript.length; i += SEGMENT_SIZE) {
    segments.push(transcript.slice(i, i + SEGMENT_SIZE))
  }

  console.log(`   📊 ${transcript.length.toLocaleString()} kar → ${segments.length} szegmens`)

  const facts: string[] = []
  for (let i = 0; i < segments.length; i++) {
    process.stdout.write(`   🔍 ${i + 1}/${segments.length}... `)
    const fact = await extractKeyFacts(client, segments[i], i + 1, segments.length, lang)
    facts.push(`=== ${i + 1}. RÉSZ ===\n${fact}`)
    console.log("✅")
    await new Promise(r => setTimeout(r, 500))
  }

  process.stdout.write("   ✍️  Cikk generálás... ")

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: `Te az Ultra Lab ultrafutás tudástár szerkesztője vagy.

Videó: "${title}" (${langLabel(lang)})

Kinyert tények:
${facts.join('\n\n')}

Írj tudástár cikket. CSAK valid JSON, aposztrófot használj idézőjel helyett:

{
  "title_hu": "max 80 kar",
  "title_en": "max 80 chars",
  "excerpt_hu": "2-3 mondat a legjobb konkrét részlettel",
  "excerpt_en": "2-3 sentences with best specific detail",
  "content_hu": "min 600 szó, ## alcímekkel, **kiemelésekkel**, minden konkrét adat belekerül",
  "content_en": "min 600 words, same structure",
  "topics": ["backyard_ultra","nutrition","training","mental","sleep","gear","race_strategy","recovery"],
  "level": "beginner/advanced/elite",
  "runner_name": "név vagy null"
}`
    }]
  })

  const raw = response.content[0].type === "text" ? response.content[0].text : ""
  let text = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

  if (!text.endsWith("}")) {
    const lastComma = text.lastIndexOf('",\n')
    if (lastComma > 0) {
      text = text.slice(0, lastComma + 1) + '\n  "level": "advanced",\n  "runner_name": null\n}'
    }
  }

  try { return JSON.parse(text) }
  catch {
    return {
      title_hu: title, title_en: title,
      excerpt_hu: "Ultra futás tapasztalatok.",
      excerpt_en: "Ultra running experiences.",
      content_hu: "", content_en: "",
      topics: ["training"], level: "advanced", runner_name: null,
    }
  }
}

const TOPICS_VALID = ["backyard_ultra", "nutrition", "training", "mental", "sleep", "gear", "race_strategy", "recovery"]

async function main() {
  console.log("\n🏃 Ultra Lab – Napi Csatorna Pipeline")
  console.log(`📅 ${new Date().toLocaleDateString('hu-HU')} | Max ${MAX_NEW_ARTICLES_PER_RUN} új cikk`)
  console.log("=".repeat(60))

  const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY"]
  const missing = required.filter(k => !process.env[k])
  if (missing.length > 0) {
    console.error("❌ Hiányzó env:", missing.join(", "))
    process.exit(1)
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const { data: sources } = await db.from('sources').select('*').eq('active', true)
  if (!sources?.length) {
    console.log("Nincs aktív forrás.")
    return
  }

  console.log(`📺 ${sources.length} aktív csatorna`)

  let newArticles = 0

  for (const source of sources) {
    if (newArticles >= MAX_NEW_ARTICLES_PER_RUN) {
      console.log("\n✋ Napi limit elérve, megállás.")
      break
    }

    console.log(`\n📺 ${source.name} (${source.language})`)

    const videos = await getChannelVideos(source.channel_id, 15)
    if (!videos.length) {
      console.log("   Nincs videó vagy hiányzik az API kulcs")
      continue
    }

    for (const video of videos) {
      if (newArticles >= MAX_NEW_ARTICLES_PER_RUN) break

      // 1. Már feldolgozva?
      const { data: existing } = await db
        .from('articles').select('id')
        .eq('source_url', `https://www.youtube.com/watch?v=${video.videoId}`).single()
      if (existing) continue

      // 2. Releváns cím?
      if (!isRelevantTitle(video.title)) {
        console.log(`   ⏭  Nem releváns: ${video.title}`)
        continue
      }

      // 3. Elég hosszú? (40+ perc)
      const duration = await getVideoDuration(video.videoId)
      const durationMin = Math.round(duration / 60)
      if (duration > 0 && duration < MIN_VIDEO_DURATION_SECONDS) {
        console.log(`   ⏭  Túl rövid (${durationMin} perc): ${video.title}`)
        continue
      }

      console.log(`\n   🎯 ${video.title} (${durationMin > 0 ? durationMin + ' perc' : 'ismeretlen hossz'})`)

      // 4. Felirat
      process.stdout.write("   📄 Felirat... ")
      const transcriptData = await getTranscript(video.videoId)
      if (!transcriptData || transcriptData.text.length < 5000) {
        console.log("❌ Nincs/rövid felirat")
        continue
      }
      console.log(`✅ ${transcriptData.text.length.toLocaleString()} kar`)

      // 5. Cikk generálás
      let generated: any
      try {
        generated = await generateArticle(claude, transcriptData.text, video.title, transcriptData.lang)
        console.log(`   ✅ "${generated.title_hu}"`)
      } catch (err: any) {
        console.log(`   ❌ ${err.message}`)
        continue
      }

      if (!generated.content_hu || generated.content_hu.length < 100) {
        console.log("   ❌ Üres tartalom, kihagyva")
        continue
      }

      // 6. Mentés
      const videoDate = await getVideoDate(video.videoId)
      const validTopics = (generated.topics || []).filter((t: string) => TOPICS_VALID.includes(t))
      const slug = slugify(generated.title_hu || video.title, video.videoId)

      const { error: dbErr } = await db.from('articles').insert({
        slug,
        title_hu: generated.title_hu, title_en: generated.title_en,
        excerpt_hu: generated.excerpt_hu, excerpt_en: generated.excerpt_en,
        content_hu: generated.content_hu, content_en: generated.content_en,
        topics: validTopics, level: generated.level || "advanced",
        runner_name: generated.runner_name || null,
        discipline: validTopics.includes("backyard_ultra") ? "backyard_ultra" : "trail_ultra",
        status: "ai_published",
        published_at: new Date().toISOString(),
        video_date: videoDate || null,
        source_url: `https://www.youtube.com/watch?v=${video.videoId}`,
        source_type: "youtube",
      })

      if (dbErr) {
        console.log(`   ❌ DB hiba: ${dbErr.message}`)
        continue
      }

      // 7. Email
      process.stdout.write("   📧 Email... ")
      try {
        await sendArticleReviewEmail({
          videoId: video.videoId, videoTitle: video.title,
          title_hu: generated.title_hu, title_en: generated.title_en,
          excerpt_hu: generated.excerpt_hu, excerpt_en: generated.excerpt_en,
          content_hu: generated.content_hu, content_en: generated.content_en,
          topics: validTopics, level: generated.level || "advanced",
          runner_name: generated.runner_name || null,
          source_url: `https://www.youtube.com/watch?v=${video.videoId}`, slug,
        })
        console.log("✅")
      } catch (e: any) {
        console.log(`⚠️  ${e.message}`)
      }

      await db.from('sources').update({ last_checked: new Date().toISOString() }).eq('id', source.id)
      newArticles++
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log(`\n✅ Kész! ${newArticles} új cikk generálva.\n`)
}

main().catch(err => {
  console.error("\n❌ Fatális hiba:", err.message)
  process.exit(1)
})
