import Link from 'next/link'

interface HeroProps {
  articleCount?: number
}

export default function Hero({ articleCount = 0 }: HeroProps) {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-end px-14 pb-20 overflow-hidden"
      style={{ background: 'var(--forest)' }}
    >
      {/* Background image */}
      <img
        src="/hero.jpg"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 30%',
          opacity: 0.45,
          pointerEvents: 'none',
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, rgba(15,26,18,.1) 0%, rgba(15,26,18,.6) 55%, rgba(15,26,18,.97) 100%)',
      }} />

      {/* Content */}
      <div className="relative">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase mb-5 flex items-center gap-3"
          style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>
          <span className="inline-block w-7 h-px flex-shrink-0" style={{ background: 'var(--accent)' }} />
          Ultra Lab · tudástár
        </p>

        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontSize: 'clamp(80px, 10vw, 152px)',
          lineHeight: 0.88,
          letterSpacing: '-0.01em',
          textTransform: 'uppercase',
          color: '#fff',
          margin: 0,
        }}>
          Menj<br />
          tovább.<br />
          Tudj<br />
          <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>többet.</em>
        </h1>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 36, gap: 40 }}>
          <div>
            <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 300, marginBottom: 32, maxWidth: 420, color: 'rgba(234,217,194,0.75)' }}>
              Az ultrafutás legmélyebb tudása egy helyen. Top futók stratégiái,
              tapasztalatai és bevált módszerei – magyarul és angolul.
            </p>
            <Link href="/cikkek" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, fontSize: 13, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--accent)',
              textDecoration: 'none', borderBottom: '1px solid var(--accent)',
              paddingBottom: 3,
            }}>
              Tudástár megnyitása →
            </Link>
          </div>

          <div style={{ display: 'flex', gap: 44, flexShrink: 0 }}>
            {[
              { num: articleCount > 0 ? `${articleCount}+` : '21+', label: 'Interjú' },
              { num: '8',  label: 'Témakör' },
              { num: '∞', label: 'Yard' },
            ].map(s => (
              <div key={s.label}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900, fontSize: 42, color: '#fff', lineHeight: 1,
                }}>{s.num}</div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: 'rgba(102,112,112,0.8)', marginTop: 4,
                }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
