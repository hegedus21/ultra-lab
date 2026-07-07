import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getAllSlugs } from '@/lib/content'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://ultra-lab-eight.vercel.app'

  // Statikus oldalak
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/cikkek`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/ai`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/rolunk`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  // Markdown cikkek
  const huSlugs = getAllSlugs('hu')
  const markdownPages: MetadataRoute.Sitemap = huSlugs.map(slug => ({
    url: `${base}/cikkek/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // AI cikkek Supabase-ből
  let aiPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('articles')
      .select('slug, published_at')
      .eq('status', 'ai_published')
      .order('published_at', { ascending: false })

    aiPages = (data || []).map(a => ({
      url: `${base}/ai/${a.slug}`,
      lastModified: new Date(a.published_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch { }

  return [...staticPages, ...markdownPages, ...aiPages]
}
