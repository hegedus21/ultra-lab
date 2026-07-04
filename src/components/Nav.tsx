"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "Tudástár", href: "/cikkek" },
    { label: "AI szekció", href: "/ai" },
    { label: "Témák", href: "/#topics" },
    { label: "Rólunk", href: "/rolunk" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        background:
          scrolled || menuOpen ? "rgba(15,26,18,0.96)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        transition: "background 0.3s",
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontSize: 22,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#fff",
          textDecoration: "none",
        }}
      >
        Ultra<span style={{ color: "var(--accent)" }}>Lab</span>
      </Link>

      {/* Desktop links */}
      <ul
        style={{
          display: "flex",
          gap: 28,
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
        className="nav-desktop"
      >
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                color:
                  pathname === link.href
                    ? "var(--accent)"
                    : "rgba(255,255,255,0.65)",
                transition: "color 0.2s",
              }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Lang switcher - desktop only */}
        <div className="nav-desktop" style={{ display: "flex", gap: 3 }}>
          {(["HU", "EN"] as const).map((lang) => (
            <button
              key={lang}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                padding: "3px 8px",
                border: `1px solid ${lang === "HU" ? "var(--accent)" : "rgba(255,255,255,0.2)"}`,
                background: lang === "HU" ? "var(--accent)" : "transparent",
                color: lang === "HU" ? "#111" : "rgba(255,255,255,0.45)",
                cursor: "pointer",
              }}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Hamburger - mobile only */}
        <button
          className="nav-mobile"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            gap: 5,
            padding: 4,
          }}
        >
          <span
            style={{
              width: 24,
              height: 2,
              background: menuOpen ? "var(--accent)" : "#fff",
              display: "block",
              transition: "background 0.2s",
            }}
          />
          <span
            style={{
              width: 24,
              height: 2,
              background: menuOpen ? "var(--accent)" : "#fff",
              display: "block",
              transition: "background 0.2s",
            }}
          />
          <span
            style={{
              width: 24,
              height: 2,
              background: menuOpen ? "var(--accent)" : "#fff",
              display: "block",
              transition: "background 0.2s",
            }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="nav-mobile"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "rgba(15,26,18,0.98)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: 20,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                textDecoration: "none",
                color: pathname === link.href ? "var(--accent)" : "#fff",
              }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {(["HU", "EN"] as const).map((lang) => (
              <button
                key={lang}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  padding: "5px 12px",
                  border: `1px solid ${lang === "HU" ? "var(--accent)" : "rgba(255,255,255,0.2)"}`,
                  background: lang === "HU" ? "var(--accent)" : "transparent",
                  color: lang === "HU" ? "#111" : "rgba(255,255,255,0.45)",
                  cursor: "pointer",
                }}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) { .nav-mobile { display: none !important; } }
        @media (max-width: 767px) { .nav-desktop { display: none !important; } }
      `}</style>
    </nav>
  );
}
