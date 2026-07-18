import { YoutubeTranscript } from 'youtube-transcript'
import { fetch as undiciFetch, ProxyAgent } from 'undici'

// Vercel/GitHub Actions szerver IP-ket a YouTube gyakran blokkolja feliratletöltésnél.
// Ha be van állítva egy proxy URL (pl. Webshare: http://user:pass@p.webshare.io:80),
// minden YouTube-hívás azon megy át; enélkül simán a sima fetch-et használjuk.
const proxyUrl = process.env.YT_PROXY_URL
const proxyDispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : null

const youtubeFetch = (proxyDispatcher
  ? ((input: string, init?: RequestInit) =>
      undiciFetch(input, { ...(init as any), dispatcher: proxyDispatcher }))
  : fetch) as typeof fetch

export async function getVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    )
    if (res.ok) {
      const data = await res.json() as { title: string }
      return data.title
    }
  } catch { }
  return videoId
}

export async function getVideoDate(videoId: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (apiKey) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${apiKey}`
      )
      if (res.ok) {
        const data = await res.json()
        const publishedAt = data.items?.[0]?.snippet?.publishedAt
        if (publishedAt) return publishedAt.split('T')[0]
      }
    } catch { }
  }
  // Fallback: HTML scraping
  try {
    const res = await youtubeFetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const html = await res.text()
    const match = html.match(/"publishDate":"([^"]+)"/) ||
      html.match(/"datePublished":"([^"]+)"/)
    if (match) return match[1].split('T')[0]
  } catch { }
  return null
}

export async function getTranscript(videoId: string): Promise<{ text: string; lang: string } | null> {
  // Próbáljuk az összes releváns nyelvet
  const langs = ['hu', 'en', 'ru', 'a.hu', 'a.en', 'a.ru', 'hu-HU', 'en-US']
  let lastError: unknown = null
  for (const lang of langs) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang, fetch: youtubeFetch })
      if (transcript && transcript.length > 0) {
        const text = transcript.map((t: any) => t.text).join(' ')
        if (text.length > 300) {
          return { text, lang: lang.replace('a.', '') }
        }
      }
    } catch (e) { lastError = e }
  }
  // Utolsó próba: nyelv nélkül
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { fetch: youtubeFetch })
    if (transcript && transcript.length > 0) {
      const text = transcript.map((t: any) => t.text).join(' ')
      if (text.length > 300) return { text, lang: 'hu' }
    }
  } catch (e) { lastError = e }
  if (lastError) {
    const msg = lastError instanceof Error ? lastError.message : String(lastError)
    console.error(`   [transcript hiba] ${videoId}: ${msg}`)
  }
  return null
}

export async function getChannelVideos(channelId: string, maxResults = 10): Promise<{ videoId: string, title: string }[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not set')
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&part=snippet&key=${apiKey}`
  )
  const data = await res.json()
  return (data.items || []).map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
  }))
}

export function videoUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`
}