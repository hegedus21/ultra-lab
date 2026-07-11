import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { sendArticleReviewEmail } from '@/lib/email'
import { getTranscript, getVideoDate } from '@/lib/youtube'

export const maxDuration = 300 // 5 perc max (Vercel Pro limitje)
export const dynamic = 'force-dynamic'

const SEGMENT_SIZE = 45000
const MAX_NEW_PER_RUN = 1
const MIN_TRANSCRIPT = 5000
const MIN_DURATION_SEC = 40 * 60

const RELEVANT = [
  'ultra', 'marathon', 'maraton', 'backyard', 'trail', 'running', 'futás', 'futó',
  'бег', 'ультра', 'марафон', 'трейл', 'endurance', 'kitartás', 'ironman',
  'nutrition', 'táplálkozás', 'питание', 'training', 'edzés', 'тренировка',
  'mental', 'mentális', 'mitochondria', 'митохондрии', 'race', 'verseny',
  'spartatlon', 'balaton', '100km', '100 km', '100 mile', 'health', 'egészség',
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

async function getVideosFromRSS(channelId: string): Promise<{ videoId: string, title: string, publishedAt: string }[]> {
  try {
    let cid = channelId
    if (!channelId.startsWith('UC')) {
      const apiKey = process.env.YOUTUBE_API_KEY
      if (apiKey) {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?forHandle=${channelId}&part=id&key=${apiKey}`)
        const data = await res.json()
        cid = data.items?.[0]?.id || channelId
      }
    }
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${cid}`)
    if (!res.ok) return []
    const xml = await res.text()
    const entries: { videoId: string, title: string, publishedAt: string }[] = []
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
  } catch { return [] }
}

async function getVideosFromAPI(channelId: string): Promise<{ videoId: string, title: string, publishedAt: string }[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []
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

async function getVideoDuration(videoId: string): Promise<number> {
  const apiKey = process.env.YOUTUBE_API_KEY
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
    model: 'claude-haiku-4-5-20251001', max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Ultrafutós interjú ${n}/${total}. rész (${langLabel(lang)}).
Emeld ki: számok, edzésmódszerek, táplálkozás, felszerelés, mentális technikák, személyes történetek.
Max 350 szó, csak konkrétumok.\n\n${segment}`
    }]
  })
  return res.content[0].type === 'text' ? res.content[0].text : ''
}

async function generateArticle(client: Anthropic, transcript: string, title: string, lang: string): Promise<any> {
  const segments: string[] = []
  for (let i = 0; i < transcript.length; i += SEGMENT_SIZE) segments.push(transcript.slice(i, i + SEGMENT_SIZE))

  const facts: string[] = []
  for (let i = 0; i < segments.length; i++) {
    facts.push(`=== ${i + 1}. RÉSZ ===\n` + await extractKeyFacts(client, segments[i], i + 1, segments.length, lang))
    await new Promise(r => setTimeout(r, 500))
  }

  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Ultra Lab tudástár. Videó: "${title}" (${langLabel(lang)})\n\nTények:\n${facts.join('\n\n')}\n\nÍrj cikket. CSAK JSON, aposztróf idézőjel helyett:\n{"title_hu":"max 80 kar","title_en":"max 80 chars","excerpt_hu":"2-3 mondat","excerpt_en":"2-3 sentences","content_hu":"min 600 szó ## alcímekkel **kiemelésekkel**","content_en":"min 600 words","topics":["backyard_ultra","nutrition","training","mental","sleep","gear","race_strategy","recovery"],"level":"beginner/advanced/elite","runner_name":"név vagy null"}`
    }]
  })

  const raw = res.content[0].type === 'text' ? res.content[0].text : ''
  let text = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  if (!text.endsWith('}')) {
    const lc = text.lastIndexOf('",\n')
    text = lc > 0 ? text.slice(0, lc + 1) + '\n  "level": "advanced",\n  "runner_name": null\n}' : text + '"}'
  }
  try { return JSON.parse(text) }
  catch { return { title_hu: title, title_en: title, excerpt_hu: '', excerpt_en: '', content_hu: '', content_en: '', topics: ['training'], level: 'advanced', runner_name: null } }
}

const VALID_TOPICS = ["backyard_ultra", "nutrition", "training", "mental", "sleep", "gear", "race_strategy", "recovery"]

export async function GET(request: Request) {
  // Vercel Cron authentikáció
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const { data: sources } = await db.from('sources').select('*').eq('active', true)
  if (!sources?.length) return NextResponse.json({ ok: true, message: 'Nincs aktív forrás' })

  let newArticles = 0
  const log: string[] = []

  for (const source of sources) {
    if (newArticles >= MAX_NEW_PER_RUN) break

    let videos = await getVideosFromRSS(source.channel_id)
    if (videos.length === 0) videos = await getVideosFromAPI(source.channel_id)

    for (const video of videos) {
      if (newArticles >= MAX_NEW_PER_RUN) break

      const { data: existing } = await db.from('articles').select('id')
        .eq('source_url', `https://www.youtube.com/watch?v=${video.videoId}`).single()
      if (existing) continue
      if (!isRelevant(video.title)) continue

      const duration = await getVideoDuration(video.videoId)
      if (duration > 0 && duration < MIN_DURATION_SEC) continue

      const transcriptData = await getTranscript(video.videoId)
      if (!transcriptData || transcriptData.text.length < MIN_TRANSCRIPT) continue

      let generated: any
      try {
        generated = await generateArticle(claude, transcriptData.text, video.title, transcriptData.lang)
      } catch { continue }

      if (!generated.content_hu || generated.content_hu.length < 100) continue

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

      if (dbErr) continue

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
      } catch { }

      await db.from('sources').update({ last_checked: new Date().toISOString() }).eq('id', source.id)
      log.push(generated.title_hu)
      newArticles++
    }
  }

  return NextResponse.json({ ok: true, newArticles, articles: log })
}
