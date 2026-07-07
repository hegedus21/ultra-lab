import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getAllSlugs, getArticleBySlug } from "@/lib/content";
import { LEVELS, RACE_TYPES, TOPICS } from "@/lib/taxonomy";
import Link from "next/link";

export function generateStaticParams() {
  return getAllSlugs("hu").map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug("hu", slug);
  if (!article) return { title: "Cikk nem található" };
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: article.coverImage
        ? [{ url: article.coverImage, width: 1200, height: 630 }]
        : [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug("hu", slug);
  if (!article) notFound();

  return (
    <>
      <Nav />

      {/* Hero */}
      <div
        style={{
          background: "var(--forest)",
          paddingTop: 120,
          paddingBottom: 56,
          paddingLeft: 56,
          paddingRight: 56,
        }}
        className="article-hero-pad"
      >
        <Link
          href="/cikkek"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(168,255,62,0.6)",
            textDecoration: "none",
          }}
        >
          ← Tudástár
        </Link>

        {/* Loop number badge */}
        <div
          style={{
            margin: "20px 0 12px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: 13,
              background: "var(--accent)",
              color: "#111",
              padding: "4px 12px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {String(article.loopNumber).padStart(2, "0")}. cikk a tudástárban
          </div>
        </div>

        {/* Topics & race types */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          {article.raceTypes.map((r) => (
            <span
              key={r}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--accent)",
                border: "1px solid var(--accent)",
                padding: "3px 8px",
              }}
            >
              {RACE_TYPES[r]?.labelHu}
            </span>
          ))}
          {article.topics.map((t) => (
            <span
              key={t}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(234,217,194,0.5)",
                border: "1px solid rgba(234,217,194,0.2)",
                padding: "3px 8px",
              }}
            >
              {TOPICS[t]?.labelHu}
            </span>
          ))}
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(234,217,194,0.5)",
              border: "1px solid rgba(234,217,194,0.2)",
              padding: "3px 8px",
            }}
          >
            {LEVELS[article.level]?.labelHu}
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(32px,4.5vw,68px)",
            textTransform: "uppercase",
            lineHeight: 0.93,
            color: "#fff",
            margin: "0 0 20px",
          }}
        >
          {article.title}
        </h1>

        {/* Meta */}
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
            flexWrap: "wrap",
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span style={{ fontSize: 14, color: "rgba(234,217,194,0.6)" }}>
            🏃 {article.athlete}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "rgba(168,255,62,0.4)",
              letterSpacing: "0.08em",
            }}
          >
            forrásnyelv: {article.sourceLang === "en" ? "angol" : "orosz"}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "rgba(168,255,62,0.4)",
              letterSpacing: "0.08em",
            }}
          >
            {article.date}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        style={{ maxWidth: 780, margin: "0 auto", padding: "56px 24px 80px" }}
      >
        <div className="prose-ultra">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.content}
          </ReactMarkdown>
        </div>
      </div>

      <Footer />

      <style>{`
        @media (max-width: 767px) {
          .article-hero-pad { padding-left: 24px !important; padding-right: 24px !important; }
        }
      `}</style>
    </>
  );
}
