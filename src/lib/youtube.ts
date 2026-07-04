import { YoutubeTranscript } from 'youtube-transcript'

export interface VideoInfo {
  videoId: string
  title: string
  url: string
  transcript: string
  language: string
}

export async function getChannelVideos(channelId: string, maxResults = 10): Promise<{videoId: string, title: string}[]> {
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

export async function getTranscript(videoId: string): Promise<string | null> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    return transcript.map(t => t.text).join(' ')
  } catch {
    return null
  }
}

export function videoUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`
}
