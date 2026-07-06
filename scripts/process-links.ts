/**
 * Ultra Lab – YouTube link feldolgozó v3
 * Szegmentált feldolgozás, magyar/angol/orosz támogatás
 * Használat: npx tsx scripts/process-links.ts
 */

import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"
import * as fs from "fs"
import { sendArticleReviewEmail } from '../src/lib/email'
import { getVideoTitle, getVideoDate, getTranscript } from '../src/lib/youtube'

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

const YOUTUBE_LINKS = [
  // ── Eredeti 21 link ──────────────────────────────────────────────────────
  "https://www.youtube.com/watch?v=_nsqj2ab3Io",
  "https://www.youtube.com/watch?v=Tsic175-Qjw",
  "https://www.youtube.com/watch?v=pj3PyLQq0hA",
  "https://www.youtube.com/watch?v=nQ8aPDRYw3U",
  "https://www.youtube.com/watch?v=t9Tt2A9z7OM",
  "https://www.youtube.com/watch?v=S3LT2XfyBdo",
  "https://www.youtube.com/watch?v=X2JkDdmEIR8",
  "https://www.youtube.com/watch?v=1YWN94gb5ro",
  "https://www.youtube.com/watch?v=3iwcu6RNOes",
  "https://www.youtube.com/watch?v=-hTLVbvn5v4",
  "https://www.youtube.com/watch?v=wr-PN9O7AqI",
  "https://www.youtube.com/watch?v=YVse-ZA3cNs",
  "https://www.youtube.com/watch?v=XQj8tsNrag8",
  "https://www.youtube.com/watch?v=sWxulzEeJ6A",
  "https://www.youtube.com/watch?v=NOnsSMRZk5g",
  "https://www.youtube.com/watch?v=WeQU9lichYo",
  "https://www.youtube.com/watch?v=k77yafi6fFo",
  "https://www.youtube.com/watch?v=ihzDWsnTpzA",
  "https://www.youtube.com/watch?v=kvzKTx8wM-c",
  "https://www.youtube.com/watch?v=wwFKkKba_h8",
  "https://www.youtube.com/watch?v=noeNikVKrmA",
  // ── Új 13 link ───────────────────────────────────────────────────────────
  "https://www.youtube.com/watch?v=vsfpUM8Cpx4",
  "https://www.youtube.com/watch?v=w_jgGMd0O6U",
  "https://www.youtube.com/watch?v=YNT1-IfWeuk",
  "https://www.youtube.com/watch?v=Ea1n4CfMTJQ",
  "https://www.youtube.com/watch?v=gvHdjQsdOFk",
  "https://www.youtube.com/watch?v=EjyMlngxSQ0",
  "https://www.youtube.com/watch?v=8sM_IcD-l1A",
  "https://www.youtube.com/watch?v=YH9UfA2acwc",
  "https://www.youtube.com/watch?v=4ml84kz_CMM",
  "https://www.youtube.com/watch?v=faBGPnTqvEA",
  "https://www.youtube.com/watch?v=Ob_Bsm722uI",
  "https://www.youtube.com/watch?v=a_FASiYa_2o",
  "https://www.youtube.com/watch?v=-Ew-LfKKXps",
]

const TOPICS = ["backyard_ultra", "nutrition", "training", "mental", "sleep", "gear", "race_strategy", "recovery"]
const SEGMENT_SIZE = 45000

function langLabel(lang: string): string {
  if (lang === 'ru') return 'orosz'
  if (lang === 'hu') return 'magyar'
  return 'angol'
}

function extractVideoId(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/)
  return match ? match[1] : null
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

async function extractKeyFacts(
  client: Anthropic,
  segment: string,
  segmentNum: number,
  totalSegments: number,
  lang: string
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `Ez egy ultrafutós interjú ${segmentNum}/${totalSegments}. része (${langLabel(lang)} nyelven).

Olvasd el és emeld ki a LEGFONTOSABB konkrét információkat. Fókuszálj:
- Konkrét számok, adatok, időpontok, távolságok, tempók
- Edzésmódszerek, heti/napi rutinok, edzésmennyiségek
- Versenyszabályok, logisztika, versenyspecifikus tudás
- Táplálkozási stratégiák, konkrét ételek, adagok
- Felszerelés, cipők, eszközök
- Mentális technikák, konkrét példák, módszerek
- Személyes történetek, anekdoták, fordulópontok
- Sérülések, regeneráció, konkrét protokollok

Légy tömör, max 350 szó. Csak konkrétumokat írj, általánosságokat és ismétléseket hagyd ki.

SZÖVEG:
${segment}`
    }]
  })
  return response.content[0].type === 'text' ? response.content[0].text : ''
}

async function generateArticle(
  client: Anthropic,
  transcript: string,
  title: string,
  lang: string
): Promise<any> {
  const segments: string[] = []
  for (let i = 0; i < transcript.length; i += SEGMENT_SIZE) {
    segments.push(transcript.slice(i, i + SEGMENT_SIZE))
  }

  console.log(`\n   📊 ${transcript.length.toLocaleString()} karakter → ${segments.length} szegmens`)

  const facts: string[] = []
  for (let i = 0; i < segments.length; i++) {
    process.stdout.write(`   🔍 Szegmens ${i + 1}/${segments.length}... `)
    const fact = await extractKeyFacts(client, segments[i], i + 1, segments.length, lang)
    facts.push(`=== ${i + 1}. RÉSZ ===\n${fact}`)
    console.log("✅")
    await new Promise(r => setTimeout(r, 500))
  }

  const combinedFacts = facts.join('\n\n')
  process.stdout.write(`   ✍️  Cikk generálás... `)

  const prompt = `Te az Ultra Lab ultrafutás tudástár szerkesztője vagy.

Videó cím: "${title}"
Átirat nyelve: ${langLabel(lang)}

Az interjú különböző részeiből kinyert kulcstények:
${combinedFacts}

Írj strukturált tudástár cikket. Foglalj bele MINDEN konkrét számot, adatot, szabályt és történetet.
Válaszolj CSAK valid JSON-nal. Ne használj idézőjelet (") a szövegekben, helyette aposztrófot ('):

{
  "title_hu": "Cím magyarul max 80 karakter",
  "title_en": "Title in English max 80 chars",
  "excerpt_hu": "2-3 mondatos összefoglaló a legérdekesebb konkrét részlettel",
  "excerpt_en": "2-3 sentence summary with the most interesting specific detail",
  "content_hu": "Teljes cikk magyarul minimum 600 szó. ## Alcímekkel tagolva. **Fontos dolgok** kiemelhetek. Minden konkrét adat belekerül.",
  "content_en": "Full article in English minimum 600 words. Same structure with ## headings.",
  "topics": ["csak releváns: backyard_ultra, nutrition, training, mental, sleep, gear, race_strategy, recovery"],
  "level": "beginner vagy advanced vagy elite",
  "runner_name": "A futó neve vagy null"
}`

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  })

  const raw = response.content[0].type === "text" ? response.content[0].text : ""
  let text = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

  if (!text.endsWith("}")) {
    const lastComma = text.lastIndexOf('",\n')
    if (lastComma > 0) {
      text = text.slice(0, lastComma + 1) + '\n  "level": "advanced",\n  "runner_name": null\n}'
    } else {
      text = text + '"}'
    }
  }

  try {
    return JSON.parse(text)
  } catch {
    const extract = (key: string) => {
      const match = text.match(new RegExp(`"${key}":\\s*"((?:[^"\\\\]|\\\\.)*?)"`))
      return match ? match[1] : null
    }
    const extractArray = (key: string) => {
      const match = text.match(new RegExp(`"${key}":\\s*\\[([^\\]]+)\\]`))
      if (!match) return ["training"]
      return match[1].match(/"([^"]+)"/g)?.map((s: string) => s.replace(/"/g, "")) || ["training"]
    }
    return {
      title_hu: extract("title_hu") || title,
      title_en: extract("title_en") || title,
      excerpt_hu: extract("excerpt_hu") || "Ultra futás tapasztalatok.",
      excerpt_en: extract("excerpt_en") || "Ultra running experiences.",
      content_hu: extract("content_hu") || "Tartalom feldolgozás alatt.",
      content_en: extract("content_en") || "Content being processed.",
      topics: extractArray("topics"),
      level: extract("level") || "advanced",
      runner_name: extract("runner_name"),
    }
  }
}

async function main() {
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY"]
  const missing = required.filter(k => !process.env[k])
  if (missing.length > 0) {
    console.error("❌ Hiányzó .env.local értékek:", missing.join(", "))
    process.exit(1)
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  console.log(`\n🏃 Ultra Lab Pipeline v3 – ${YOUTUBE_LINKS.length} link`)
  console.log(`📊 Szegmentált feldolgozás | HU/EN/RU támogatás`)
  console.log("=".repeat(60))

  const results = { ok: 0, skip: 0, error: 0, noTranscript: 0 }
  const log: string[] = []
  const noTranscriptList: string[] = []

  for (let i = 0; i < YOUTUBE_LINKS.length; i++) {
    const url = YOUTUBE_LINKS[i]
    const videoId = extractVideoId(url)

    if (!videoId) {
      console.log(`\n[${i + 1}/${YOUTUBE_LINKS.length}] ❌ Érvénytelen URL`)
      results.error++
      continue
    }

    console.log(`\n[${i + 1}/${YOUTUBE_LINKS.length}] 📺 ${videoId}`)

    const { data: existing } = await db
      .from("articles").select("id, title_hu")
      .eq("source_url", `https://www.youtube.com/watch?v=${videoId}`).single()

    if (existing) {
      console.log(`   ⏭  Már feldolgozva: ${existing.title_hu}`)
      results.skip++
      continue
    }

    process.stdout.write("   📝 Cím és dátum lekérés... ")
    const [title, videoDate] = await Promise.all([
      getVideoTitle(videoId),
      getVideoDate(videoId),
    ])
    console.log(`${title}${videoDate ? ` (${videoDate})` : ''}`)

    process.stdout.write("   📄 Felirat letöltés... ")
    const transcriptData = await getTranscript(videoId)

    if (!transcriptData) {
      console.log("❌ Nincs felirat – kihagyva")
      noTranscriptList.push(`${title} - ${url}`)
      results.noTranscript++
      results.skip++
      continue
    }
    console.log(`✅ ${transcriptData.text.length.toLocaleString()} karakter (${transcriptData.lang})`)

    let generated: any
    try {
      generated = await generateArticle(claude, transcriptData.text, title, transcriptData.lang)
      console.log(`   ✅ "${generated.title_hu}"`)
    } catch (err: any) {
      console.log(`   ❌ Claude hiba: ${err.message}`)
      results.error++
      continue
    }

    const validTopics = (generated.topics || []).filter((t: string) => TOPICS.includes(t))
    const slug = slugify(generated.title_hu || title, videoId)

    const { error: dbErr } = await db.from("articles").insert({
      slug,
      title_hu: generated.title_hu,
      title_en: generated.title_en,
      excerpt_hu: generated.excerpt_hu,
      excerpt_en: generated.excerpt_en,
      content_hu: generated.content_hu,
      content_en: generated.content_en,
      topics: validTopics,
      level: generated.level || "advanced",
      runner_name: generated.runner_name || null,
      discipline: validTopics.includes("backyard_ultra") ? "backyard_ultra" : "trail_ultra",
      status: "ai_published",
      published_at: new Date().toISOString(),
      video_date: videoDate || null,
      source_url: `https://www.youtube.com/watch?v=${videoId}`,
      source_type: "youtube",
    })

    if (dbErr) {
      console.log(`   ❌ DB hiba: ${dbErr.message}`)
      results.error++
      continue
    }

    console.log(`   ✅ Mentve → /ai`)
    process.stdout.write("   📧 Email... ")

    try {
      await sendArticleReviewEmail({
        videoId, videoTitle: title,
        title_hu: generated.title_hu, title_en: generated.title_en,
        excerpt_hu: generated.excerpt_hu, excerpt_en: generated.excerpt_en,
        content_hu: generated.content_hu, content_en: generated.content_en,
        topics: validTopics, level: generated.level || "advanced",
        runner_name: generated.runner_name || null,
        source_url: `https://www.youtube.com/watch?v=${videoId}`, slug,
      })
      console.log("✅")
    } catch (emailErr: any) {
      console.log(`⚠️  ${emailErr.message}`)
    }

    log.push(`OK: ${generated.title_hu}`)
    results.ok++
    await new Promise(r => setTimeout(r, 1500))
  }

  console.log("\n" + "=".repeat(60))
  console.log(`\n✅ Kész! Eredmény:`)
  console.log(`   Sikeres:         ${results.ok} cikk`)
  console.log(`   Már megvolt:     ${results.skip - results.noTranscript}`)
  console.log(`   Nincs felirat:   ${results.noTranscript}`)
  console.log(`   Hiba:            ${results.error}`)
  console.log(`\n→ http://localhost:3000/ai\n`)

  if (noTranscriptList.length > 0) {
    console.log("⚠️  Felirat nélküli videók:")
    noTranscriptList.forEach(v => console.log(`   - ${v}`))
  }

  if (log.length > 0) {
    fs.writeFileSync("pipeline-results.txt", log.join("\n"))
    console.log("\n📄 Napló: pipeline-results.txt")
  }
}

main().catch(err => {
  console.error("\n❌ Fatális hiba:", err.message)
  process.exit(1)
})