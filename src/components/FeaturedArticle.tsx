import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { Article } from '@/types'
import { TOPICS } from '@/types'

export default function FeaturedArticle({ article, lang }: { article: Article; lang: 'hu' | 'en' }) {
  const t = useTranslations()
  const title   = lang === 'hu' ? article.title_hu   : article.title_en
  const excerpt = lang === 'hu' ? article.excerpt_hu : article.excerpt_en
  const topic   = TOPICS.find(tp => article.topics.includes(tp.key))

  return (
    <section className="bg-forest py-24 px-14">
      <p className="eyebrow opacity-40" style={{ color: '#EAD9C2' }}>{t('sections.featured')}</p>
      <div className="grid grid-cols-2 gap-[72px] items-center">
        <div className="relative overflow-hidden aspect-[4/3]">
          <div className="absolute top-[22px] left-[22px] w-[50px] h-[50px] bg-ember flex items-center justify-center font-display text-[21px] text-white z-10">01</div>
          {article.cover_image ? (
            <Image src={article.cover_image} alt={title || ''} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-forest2" />
          )}
        </div>

        <div>
          {topic && (
            <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ember mb-[14px]">
              {topic.label_hu} · {article.discipline.replace('_', ' ')}
            </p>
          )}
          <h2 className="font-display text-[clamp(30px,3.5vw,50px)] uppercase leading-[0.95] text-white mb-[18px]">{title}</h2>
          <p className="text-[14px] leading-[1.8] text-dawn/60 font-light mb-[28px]">{excerpt}</p>
          <Link
            href={`/articles/${article.slug}`}
            className="inline-flex items-center gap-2 font-display text-[12px] tracking-[0.12em] uppercase text-ember no-underline border-b border-ember pb-[3px] hover:gap-[14px] transition-all"
          >
            {t('article.read')} →
          </Link>
        </div>
      </div>
    </section>
  )
}
