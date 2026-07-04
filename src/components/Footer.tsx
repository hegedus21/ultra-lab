import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="px-14 py-[52px] flex items-center justify-between" style={{ background: 'var(--forest)' }}>
      <div className="font-display text-[28px] tracking-[0.14em] text-white">
        Ultra<span style={{ color: 'var(--accent)' }}>Lab</span>
      </div>
      <div className="flex gap-7">
        {[
          { label: 'Tudástár', href: '/cikkek' },
          { label: 'AI szekció', href: '/ai' },
          { label: 'Témák', href: '/#topics' },
          { label: 'Rólunk', href: '/rolunk' },
        ].map(link => (
          <Link key={link.href} href={link.href}
            className="text-[10px] no-underline tracking-[0.08em] uppercase transition-colors hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            {link.label}
          </Link>
        ))}
      </div>
      <div className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
        ultralab.vercel.app · 2026
      </div>
    </footer>
  )
}
