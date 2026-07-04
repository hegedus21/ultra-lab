"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { label: 'Tudástár', href: '/cikkek' },
    { label: 'AI szekció', href: '/ai' },
    { label: 'Témák', href: '/#topics' },
    { label: 'Rólunk', href: '/rolunk' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-14 py-5 transition-all duration-300 ${
      scrolled ? 'bg-forest/96 backdrop-blur-md' : 'bg-transparent'
    }`}>
      <Link href="/" className="font-display text-[22px] tracking-[0.14em] text-white no-underline">
        Ultra<span style={{ color: 'var(--accent)' }}>Lab</span>
      </Link>

      <ul className="flex gap-8 list-none m-0 p-0">
        {links.map(link => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[11px] font-medium tracking-[0.1em] uppercase no-underline transition-colors duration-200"
              style={{ color: pathname === link.href ? 'var(--accent)' : 'rgba(255,255,255,0.65)' }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex gap-1">
        {(['HU', 'EN'] as const).map(lang => (
          <button key={lang}
            className="font-mono text-[10px] px-2 py-1 border transition-all"
            style={{
              background: lang === 'HU' ? 'var(--accent)' : 'transparent',
              borderColor: lang === 'HU' ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
              color: lang === 'HU' ? '#111' : 'rgba(255,255,255,0.45)',
            }}
          >
            {lang}
          </button>
        ))}
      </div>
    </nav>
  )
}
