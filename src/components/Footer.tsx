import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer-wrap">
      <div className="footer-logo">
        Ultra<span style={{ color: "var(--accent)" }}>Lab</span>
      </div>
      <div className="footer-links">
        {[
          { label: "Tudástár", href: "/cikkek" },
          { label: "AI szekció", href: "/ai" },
          { label: "Témák", href: "/#topics" },
          { label: "Rólunk", href: "/rolunk" },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="footer-link">
            {link.label}
          </Link>
        ))}
      </div>
      <div className="footer-copy">ultralab.vercel.app · 2026</div>
    </footer>
  );
}
