import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-[var(--color-line)]">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="font-display text-2xl tracking-tight text-[var(--color-bone)]">
            Ultra<span className="text-[var(--color-amber)]">Lab</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-bone-muted)]">
          <Link href="/cikkek" className="hover:text-[var(--color-amber)] transition-colors">
            Tudástár
          </Link>
          <Link href="/#kategoriak" className="hover:text-[var(--color-amber)] transition-colors">
            Kategóriák
          </Link>
          <Link href="/#rolunk" className="hover:text-[var(--color-amber)] transition-colors">
            Rólunk
          </Link>
        </nav>
      </div>
    </header>
  );
}
