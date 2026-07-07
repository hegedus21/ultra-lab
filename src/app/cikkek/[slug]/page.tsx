import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Header from "@/components/Header";
import LoopRing from "@/components/LoopRing";
import { getAllSlugs, getArticleBySlug } from "@/lib/content";
import { LEVELS, RACE_TYPES, TOPICS } from "@/lib/taxonomy";
import type { Metadata } from "next";

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
        ? [
            {
              url: article.coverImage,
              width: 1200,
              height: 630,
              alt: article.title,
            },
          ]
        : [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
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
      <Header />
      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-8">
            <LoopRing
              active={article.loopNumber}
              total={12}
              size={72}
              label=""
            />
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-moss)]">
              {String(article.loopNumber).padStart(2, "0")}. cikk a tudástárban
            </div>
          </div>

          <h1 className="font-display text-3xl md:text-4xl leading-tight text-[var(--color-bone)] mb-6">
            {article.title}
          </h1>

          <div className="flex flex-wrap gap-2 mb-10">
            {article.raceTypes.map((r) => (
              <span
                key={r}
                className="text-[11px] font-mono uppercase tracking-wide px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-amber)]"
              >
                {RACE_TYPES[r]?.labelHu}
              </span>
            ))}
            {article.topics.map((t) => (
              <span
                key={t}
                className="text-[11px] font-mono uppercase tracking-wide px-2 py-1 border border-[var(--color-line)] text-[var(--color-bone-muted)]"
              >
                {TOPICS[t]?.labelHu}
              </span>
            ))}
            <span className="text-[11px] font-mono uppercase tracking-wide px-2 py-1 border border-[var(--color-line)] text-[var(--color-bone-muted)]">
              {LEVELS[article.level]?.labelHu}
            </span>
          </div>

          <div className="flex items-center justify-between border-y border-[var(--color-line)] py-4 mb-10 font-mono text-xs text-[var(--color-bone-muted)]">
            <span>
              {article.athlete} · {article.athleteCountry}
            </span>
            <span>
              forrásnyelv: {article.sourceLang === "en" ? "angol" : "orosz"}
            </span>
          </div>

          <div className="prose-ultra">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content}
            </ReactMarkdown>
          </div>
        </article>
      </main>
    </>
  );
}
