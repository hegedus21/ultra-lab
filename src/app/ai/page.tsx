import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

async function getAiArticles() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('articles')
    .select('id, slug, title_hu, excerpt_hu, topics, runner_name, published_at, source_url')
    .eq('status', 'ai_published')
    .order('published_at', { ascending: false })
    .limit(50)
  return data || []
}

const TOPIC_LABELS: Record<string, string> = {
  backyard_ultra: 'Backyard Ultra', nutrition: 'Táplálkozás',
  training: 'Felkészülés', mental: 'Mentális stratégia',
  sleep: 'Alvásmenedzsment', gear: 'Felszerelés',
  race_strategy: 'Versenytaktika', recovery: 'Regeneráció',
}

export default async function AiPage() {
  const articles = await getAiArticles()

  return (
    <>
      <Nav />
      {/* Header */}
      <div style={{ background: 'var(--forest)', paddingTop: 120, paddingBottom: 64, paddingLeft: 56, paddingRight: 56 }}>
        <div style={{
          display: 'inline-block', padding: '4px 12px',
          background: 'var(--accent)', color: '#111',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', marginBottom: 16,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          AI generált tartalom
        </div>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900, fontSize: 'clamp(48px,6vw,80px)',
          textTransform: 'uppercase', color: '#fff',
          margin: '0 0 16px', lineHeight: 0.95,
        }}>
          AI <span style={{ color: 'var(--accent)' }}>Szekció</span>
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(234,217,194,0.65)', lineHeight: 1.7, maxWidth: 600, fontWeight: 300 }}>
          Ezek a cikkek mesterséges intelligencia által, automatikusan lettek generálva YouTube interjúkból.
          Nincsenek szerkesztve. A szerkesztett, validált cikkeket a{' '}
          <Link href="/cikkek" style={{ color: 'var(--accent)' }}>Tudástárban</Link> találod.
        </p>
        <div style={{ marginTop: 24, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(168,255,62,0.5)', letterSpacing: '0.1em' }}>
          {articles.length} cikk
        </div>
      </div>

      {/* Articles grid */}
      <div style={{ background: 'var(--chalk)', padding: '64px 56px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {articles.map((article: any) => (
            <Link key={article.id} href={`/ai/${article.slug}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <article style={{
                background: '#fff',
                padding: '24px 28px',
                borderLeft: '3px solid transparent',
                transition: 'border-color 0.2s',
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: '#2A5A10',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    🤖 AI
                  </span>
                  {(article.topics || []).slice(0, 3).map((t: string) => (
                    <span key={t} style={{
                      fontSize: 9, color: 'var(--mist)',
                      fontFamily: "'JetBrains Mono', monospace",
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                      {TOPIC_LABELS[t] || t}
                    </span>
                  ))}
                </div>
                <h2 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800, fontSize: 22,
                  textTransform: 'uppercase', margin: '0 0 8px',
                  color: 'var(--ink)',
                }}>
                  {article.title_hu}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--mist)', lineHeight: 1.65, margin: '0 0 12px' }}>
                  {article.excerpt_hu}
                </p>
                <div style={{ fontSize: 11, color: '#aaa', display: 'flex', gap: 16, alignItems: 'center' }}>
                  {article.runner_name && <span>🏃 {article.runner_name}</span>}
                  {article.published_at && (
                    <span>{new Date(article.published_at).toLocaleDateString('hu-HU')}</span>
                  )}
                  {article.source_url && (
                    <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#2A5A10', textDecoration: 'none', fontSize: 11 }}>
                      ▶ Forrás
                    </a>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
