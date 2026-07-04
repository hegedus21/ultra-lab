import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function AiArticlePage({ params }: { params: { slug: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'ai_published')
    .single()

  if (!article) notFound()

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 780, margin: '0 auto', padding: '60px 24px' }}>
      <Link href="/ai" style={{ color: '#E05C22', fontSize: 13, textDecoration: 'none' }}>← AI Szekció</Link>

      <div style={{ margin: '24px 0 12px', padding: '12px 16px', background: '#fff7ed',
        border: '1px solid #fed7aa', fontSize: 13, color: '#9a3412' }}>
        🤖 <strong>AI által generált tartalom</strong> — Ez a cikk automatikusan készült egy YouTube interjú feliratából,
        nincs szerkesztve. A szerkesztett cikkeket a <Link href="/cikkek" style={{ color: '#E05C22' }}>Tudástárban</Link> találod.
      </div>

      <div style={{ marginTop: 32, marginBottom: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {(article.topics || []).map((t: string) => (
          <span key={t} style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#E05C22' }}>{t}</span>
        ))}
      </div>

      <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.1, margin: '0 0 12px' }}>
        {article.title_hu}
      </h1>

      {article.runner_name && (
        <p style={{ color: '#888', fontSize: 14, margin: '0 0 32px' }}>🏃 {article.runner_name}</p>
      )}

      <div style={{ fontSize: 16, lineHeight: 1.85, color: '#333', whiteSpace: 'pre-wrap' }}>
        {article.content_hu}
      </div>

      {article.source_url && (
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 8, textTransform: 'uppercase',
            letterSpacing: '0.1em', fontFamily: 'monospace' }}>Forrás</p>
          <a href={article.source_url} target="_blank" rel="noopener noreferrer"
            style={{ color: '#E05C22', fontSize: 14 }}>{article.source_url}</a>
        </div>
      )}
    </div>
  )
}
