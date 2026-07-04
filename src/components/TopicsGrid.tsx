import Link from 'next/link'

const TOPICS = [
  { key: 'backyard_ultra', label: 'Backyard Ultra',      color: '#1A5C0A', num: '01' },
  { key: 'nutrition',      label: 'Táplálkozás',         color: '#2A5FA5', num: '02' },
  { key: 'training',       label: 'Felkészülés',         color: '#2A7A4A', num: '03' },
  { key: 'mental',         label: 'Mentális stratégia',  color: '#5B3EA8', num: '04' },
  { key: 'sleep',          label: 'Alvásmenedzsment',    color: '#8A3A2A', num: '05' },
  { key: 'gear',           label: 'Felszerelés',         color: '#1A6B6B', num: '06' },
  { key: 'race_strategy',  label: 'Versenynapi taktika', color: '#6B5010', num: '07' },
  { key: 'recovery',       label: 'Regeneráció',         color: '#3A5E2A', num: '08' },
]

interface Props {
  counts?: Record<string, number>
}

export default function TopicsGrid({ counts = {} }: Props) {
  return (
    <section className="py-24 px-14" style={{ background: 'var(--chalk)' }} id="topics">
      <div className="eyebrow-dark">Témakörök</div>
      <div className="grid grid-cols-4 gap-[14px]">
        {TOPICS.map(topic => (
          <Link key={topic.key} href={`/cikkek?tema=${topic.key}`}
            className="topic-card p-6 no-underline block"
            style={{ background: 'var(--card)' }}>
            <div className="w-10 h-10 flex items-center justify-center font-display text-[18px] text-white mb-4"
              style={{ background: topic.color }}>
              {topic.num}
            </div>
            <div className="font-display text-[18px] tracking-[0.04em] mb-[6px]"
              style={{ color: 'var(--ink)' }}>
              {topic.label}
            </div>
            <div className="font-mono text-[9px] tracking-[0.1em]"
              style={{ color: 'var(--mist)' }}>
              {counts[topic.key] || 0} cikk
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        .topic-card {
          transition: background 0.2s, transform 0.2s;
        }
        .topic-card:hover {
          background: var(--ink) !important;
          transform: translateY(-4px);
        }
        .topic-card:hover .font-display,
        .topic-card:hover .font-mono {
          color: rgba(255,255,255,0.9) !important;
        }
      `}</style>
    </section>
  )
}
