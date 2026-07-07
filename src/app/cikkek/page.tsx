import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SearchAndFilter from "@/components/SearchAndFilter";
import { getAllArticles } from "@/lib/content";

export const metadata: Metadata = {
  title: "Tudástár – Minden cikk egy helyen",
  description:
    "Szerkesztett, validált ultrafutás cikkek. Felkészülés, táplálkozás, mentális stratégia és versenyeredmények top futóktól.",
};

export default function CikkekPage() {
  const articles = getAllArticles("hu");

  return (
    <>
      <Nav />

      {/* Hero */}
      <div
        style={{
          background: "var(--forest)",
          paddingTop: 120,
          paddingBottom: 64,
          paddingLeft: 56,
          paddingRight: 56,
        }}
        className="cikkek-hero-pad"
      >
        <div
          style={{
            display: "inline-block",
            padding: "4px 12px",
            background: "var(--accent)",
            color: "#111",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 16,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Szerkesztett tartalom
        </div>

        <h1
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(48px,6vw,80px)",
            textTransform: "uppercase",
            color: "#fff",
            margin: "0 0 16px",
            lineHeight: 0.95,
          }}
        >
          Tudás<span style={{ color: "var(--accent)" }}>tár</span>
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "rgba(234,217,194,0.65)",
            lineHeight: 1.7,
            maxWidth: 600,
            fontWeight: 300,
            margin: 0,
          }}
        >
          Szerkesztett, validált cikkek top ultrafutóktól. Felkészülés,
          táplálkozás, mentális stratégia és versenytaktika — valódi
          tapasztalatból.
        </p>

        <div
          style={{
            marginTop: 24,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "rgba(168,255,62,0.5)",
            letterSpacing: "0.1em",
          }}
        >
          {articles.length} cikk
        </div>
      </div>

      {/* Search & articles */}
      <div
        style={{ background: "var(--chalk)", padding: "56px 56px" }}
        className="cikkek-content-pad"
      >
        <SearchAndFilter articles={articles} />
      </div>

      <Footer />

      <style>{`
        @media (max-width: 767px) {
          .cikkek-hero-pad { padding-left: 24px !important; padding-right: 24px !important; }
          .cikkek-content-pad { padding-left: 24px !important; padding-right: 24px !important; padding-top: 40px !important; }
        }
      `}</style>
    </>
  );
}
