import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Ticker from '@/components/Ticker'
import TopicsGrid from '@/components/TopicsGrid'
import ArticleCard from '@/components/ArticleCard'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

async function getLatestArticles() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('articles')
      .select('id, slug, title_hu, excerpt_hu, topics, runner_name, published_at')
      .eq('status', 'ai_published')
      .order('published_at', { ascending: false })
      .limit(3)
    return data || []
  } catch {
    return []
  }
}

async function getArticleCount() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .in('status', ['published', 'ai_published'])
    return count || 0
  } catch {
    return 0
  }
}

export default async function HomePage() {
  const [articles, count] = await Promise.all([getLatestArticles(), getArticleCount()])

  return (
    <>
      <Nav />
      <Hero articleCount={count} />
      <Ticker />

      {/* Latest articles */}
      {articles.length > 0 && (
        <section className="py-24 px-14" style={{ background: 'var(--card)' }}>
          <div className="eyebrow-dark">Legújabb cikkek</div>
          <div className="grid grid-cols-3 gap-6 mb-10">
            {articles.map((a: any) => (
              <ArticleCard key={a.id} article={a} basePath="/ai" />
            ))}
          </div>
          <Link href="/ai"
            className="inline-flex items-center gap-2 font-display text-[13px] tracking-[0.12em] no-underline border-b pb-[3px] transition-all hover:gap-[14px]"
            style={{ color: '#2A5A10', borderColor: '#2A5A10' }}>
            Összes AI cikk →
          </Link>
        </section>
      )}

      <TopicsGrid />

      {/* Pipeline section */}
      <section className="py-24 px-14" style={{ background: 'var(--forest2)' }}>
        <div className="eyebrow">Automatizált tartalom</div>
        <div className="grid grid-cols-2 gap-20 items-start">
          <div>
            <h2 className="font-display text-white mb-4"
              style={{ fontSize: 'clamp(30px,3.2vw,48px)' }}>
              Új interjú?<br />Azonnal<br />
              <span style={{ color: 'var(--accent)' }}>tudástárrá válik.</span>
            </h2>
            <p className="text-[13px] leading-[1.85] font-light mb-7"
              style={{ color: 'rgba(234,217,194,0.55)' }}>
              Az Ultra Lab folyamatosan figyeli a top podcast csatornákat és YouTube forrásokat.
              Új tartalom megjelenésekor automatikusan feldolgozza — te elolvasod és eldöntöd
              mi kerüljön a szerkesztett tudástárba.
            </p>
            {[
              { name: 'Backyard Ultra Podcast', lang: 'EN' },
              { name: 'Nikolay Kotenkov', lang: 'RU' },
              { name: 'Kirill Tsvetkov', lang: 'RU' },
              { name: 'Rich Roll', lang: 'EN' },
              { name: 'Diary of a CEO', lang: 'EN' },
            ].map(src => (
              <div key={src.name} className="flex items-center gap-[14px] px-[18px] py-[14px] mb-[10px]"
                style={{ background: 'rgba(255,255,255,0.04)', borderLeft: '3px solid var(--accent)' }}>
                <div className="text-[18px] w-[22px] text-center" style={{ color: 'var(--accent)' }}>▶</div>
                <div>
                  <div className="font-display text-[15px] text-white">{src.name}</div>
                  <div className="font-mono text-[10px] mt-[2px]"
                    style={{ color: 'rgba(234,217,194,0.4)' }}>youtube · {src.lang}</div>
                </div>
              </div>
            ))}
          </div>
          <div>
            {[
              { n: '01', title: 'Forrás figyelés', desc: 'YouTube csatornák napi automatikus ellenőrzése' },
              { n: '02', title: 'Felirat letöltés', desc: 'Ingyenes transcript API, nem kell API kulcs' },
              { n: '03', title: 'Cikk generálás', desc: 'Claude AI strukturált tudástár cikket ír' },
              { n: '04', title: 'Email & publikálás', desc: 'Email értesítés – te szerkesztesz, te döntesz' },
            ].map((step, i) => (
              <div key={step.n} className="flex gap-4 py-[18px]"
                style={{ borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div className="font-display text-[44px] leading-none min-w-[38px]"
                  style={{ color: 'rgba(168,255,62,0.2)' }}>{step.n}</div>
                <div>
                  <div className="font-display text-[16px] tracking-[0.06em] text-white mb-1">{step.title}</div>
                  <div className="text-[11px] leading-[1.65]"
                    style={{ color: 'rgba(234,217,194,0.45)' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
