import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";

const TOPIC_LABELS: Record<string, string> = {
  backyard_ultra: "Backyard Ultra",
  nutrition: "Táplálkozás",
  training: "Felkészülés",
  mental: "Mentális stratégia",
  sleep: "Alvásmenedzsment",
  gear: "Felszerelés",
  race_strategy: "Versenytaktika",
  recovery: "Regeneráció",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function fixContent(text: string | null): string {
  if (!text) return "";
  return text
    .replace(/\\n\\n/g, "\n\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: article } = await supabase
    .from("articles")
    .select("title_hu, excerpt_hu, runner_name, cover_image")
    .eq("slug", params.slug)
    .single();

  if (!article) return { title: "Cikk nem található" };

  return {
    title: article.title_hu || "AI cikk",
    description: article.excerpt_hu || undefined,
    openGraph: {
      title: article.title_hu || "AI cikk",
      description: article.excerpt_hu || undefined,
      images: article.cover_image
        ? [{ url: article.cover_image, width: 1200, height: 630 }]
        : [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title_hu || "AI cikk",
      description: article.excerpt_hu || undefined,
    },
  };
}

export default async function AiArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", params.slug)
    .eq("status", "ai_published")
    .single();

  if (!article) notFound();

  const topics = (article.topics || []).filter((t: string) => TOPIC_LABELS[t]);
  const content = fixContent(article.content_hu);
  const hasContent =
    content.length > 50 && content !== "Tartalom feldolgozás alatt.";

  return (
    <>
      <Nav />

      <div
        style={{
          background: "var(--forest)",
          paddingTop: 120,
          paddingBottom: 56,
          paddingLeft: 56,
          paddingRight: 56,
        }}
      >
        <Link
          href="/ai"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(168,255,62,0.6)",
            textDecoration: "none",
          }}
        >
          ← AI Szekció
        </Link>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            margin: "24px 0 12px",
          }}
        >
          {topics.map((t: string) => (
            <span
              key={t}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--accent)",
              }}
            >
              {TOPIC_LABELS[t]}
            </span>
          ))}
        </div>

        <h1
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(32px,4vw,64px)",
            textTransform: "uppercase",
            lineHeight: 0.95,
            color: "#fff",
            margin: "0 0 20px",
          }}
        >
          {article.title_hu}
        </h1>

        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {article.runner_name && (
            <span style={{ fontSize: 14, color: "rgba(234,217,194,0.6)" }}>
              🏃 {article.runner_name}
            </span>
          )}
          {article.video_date && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "var(--accent)",
                letterSpacing: "0.08em",
              }}
            >
              📅 Videó dátuma: {formatDate(article.video_date)}
            </span>
          )}
          {article.source_url && (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "rgba(168,255,62,0.5)",
                textDecoration: "none",
                letterSpacing: "0.08em",
              }}
            >
              ▶ Forrás megtekintése
            </a>
          )}
        </div>
      </div>

      <div
        style={{
          background: "#fff7ed",
          borderBottom: "1px solid #fed7aa",
          padding: "12px 56px",
          fontSize: 13,
          color: "#9a3412",
        }}
      >
        🤖 <strong>AI által generált tartalom</strong> — Automatikusan készült
        egy YouTube interjú feliratából, nincs szerkesztve. A szerkesztett
        cikkeket a{" "}
        <Link href="/cikkek" style={{ color: "#E05C22" }}>
          Tudástárban
        </Link>{" "}
        találod.
      </div>

      <div
        style={{ maxWidth: 780, margin: "0 auto", padding: "56px 24px 80px" }}
      >
        {hasContent ? (
          <div className="article-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "var(--mist)",
            }}
          >
            <p style={{ marginBottom: 16, fontSize: 15 }}>
              A cikk tartalma újragenerálás alatt áll.
            </p>
            {article.source_url && (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#2A5A10", fontSize: 14 }}
              >
                ▶ Megtekintheted az eredeti videót
              </a>
            )}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
