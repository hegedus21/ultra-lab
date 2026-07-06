import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getChannelVideos, getTranscript, videoUrl } from '@/lib/youtube'
import { generateArticle } from '@/lib/claude'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.PIPELINE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseAdmin()

  // Load active sources from DB
  const { data: sources } = await db.from('sources').select('*').eq('active', true)
  if (!sources?.length) return NextResponse.json({ processed: 0 })

  let processed = 0

  for (const source of sources) {
    try {
      const videos = await getChannelVideos(source.channel_id, 5)

      for (const video of videos) {
        // Check if already processed
        const { data: existing } = await db
          .from('articles')
          .select('id')
          .eq('source_url', videoUrl(video.videoId))
          .single()

        if (existing) continue

        // Get transcript
        const transcript = await getTranscript(video.videoId)
        if (!transcript || transcript.text.length < 500) continue

        // Generate article with Claude
        const generated = await generateArticle({
          transcript: transcript.text,
          videoTitle: video.title,
          language: source.language as 'en' | 'ru',
        })

        // Save as draft for review
        await db.from('articles').insert({
          slug: video.videoId + '-' + Date.now(),
          ...generated,
          discipline: 'backyard_ultra',
          level: generated.level as any,
          status: 'review',
          source_url: videoUrl(video.videoId),
          source_type: 'youtube',
        })

        processed++
      }

      await db.from('sources').update({ last_checked: new Date().toISOString() }).eq('id', source.id)
    } catch (err) {
      console.error(`Error processing source ${source.name}:`, err)
    }
  }

  return NextResponse.json({ processed })
}
