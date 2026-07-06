#!/usr/bin/env tsx
/**
 * Ultra Lab Content Pipeline
 * Futtatás: npm run pipeline
 * Vagy GitHub Actions-ból naponta automatikusan
 */

import { getChannelVideos, getTranscript, videoUrl } from '../src/lib/youtube'
import { generateArticle } from '../src/lib/claude'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  console.log('🏃 Ultra Lab Pipeline indítás...')

  const { data: sources } = await db.from('sources').select('*').eq('active', true)
  if (!sources?.length) return console.log('Nincs aktív forrás.')

  let total = 0

  for (const source of sources) {
    console.log(`\n📺 Feldolgozás: ${source.name} (${source.language})`)

    try {
      const videos = await getChannelVideos(source.channel_id, 5)
      console.log(`   ${videos.length} videó találva`)

      for (const video of videos) {
        const { data: existing } = await db
          .from('articles')
          .select('id')
          .eq('source_url', videoUrl(video.videoId))
          .single()

        if (existing) {
          console.log(`   ⏭  Már feldolgozva: ${video.title}`)
          continue
        }

        console.log(`   ⬇  Felirat letöltés: ${video.title}`)
        const transcript = await getTranscript(video.videoId)

        if (!transcript || transcript.text.length < 500) {
          console.log(`   ❌ Nincs felirat, kihagyva`)
          continue
        }

        console.log(`   🤖 Claude cikk generálás...`)
        const generated = await generateArticle({
          transcript.text,
          videoTitle: video.title,
          language: source.language as 'en' | 'ru',
        })

        const { error } = await db.from('articles').insert({
          slug: video.videoId,
          ...generated,
          discipline: 'backyard_ultra',
          level: generated.level as any,
          status: 'review',
          source_url: videoUrl(video.videoId),
          source_type: 'youtube',
        })

        if (error) {
          console.log(`   ❌ DB hiba: ${error.message}`)
        } else {
          console.log(`   ✅ Cikk mentve review-ra: ${generated.title_hu}`)
          total++
        }
      }

      await db.from('sources').update({ last_checked: new Date().toISOString() }).eq('id', source.id)
    } catch (err) {
      console.error(`   ❌ Hiba (${source.name}):`, err)
    }
  }

  console.log(`\n✅ Pipeline kész. ${total} új cikk vár review-ra az /admin oldalon.`)
}

run().catch(console.error)
