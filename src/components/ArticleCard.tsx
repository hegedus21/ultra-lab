import Link from "next/link";

const TOPIC_LABELS: Record<string, string> = {
  // taxonomy.ts kulcsok (markdown cikkek)
  "mentalis-strategia": "Mentális stratégia",
  felkeszules: "Felkészülés",
  taplalkozas: "Táplálkozás",
  alvasmenedzsment: "Alvásmenedzsment",
  felszereles: "Felszerelés",
  serulesmegelozes: "Sérülésmegelőzés",
  "versenynapi-taktika": "Versenynapi taktika",
  regeneracio: "Regeneráció",
  // Supabase AI cikkek kulcsok
  backyard_ultra: "Backyard Ultra",
  nutrition: "Táplálkozás",
  training: "Felkészülés",
  mental: "Mentális stratégia",
  sleep: "Alvásmenedzsment",
  gear: "Felszerelés",
  race_strategy: "Versenytaktika",
  recovery: "Regeneráció",
};

export default function ArticleCard({
  article,
  basePath = "/cikkek",
}: {
  article: any;
  basePath?: string;
}) {
  const topic = Array.isArray(article.topics)
    ? article.topics[0]
    : article.topic;
  const title = article.title_hu || article.title;
  const excerpt = article.excerpt_hu || article.excerpt;
  const coverImage = article.coverImage || article.cover_image || null;

  return (
    <Link
      href={`${basePath}/${article.slug}`}
      className="block no-underline group transition-transform duration-200 hover:-translate-y-1"
      style={{ background: "#fff" }}
    >
      <div className="overflow-hidden" style={{ height: 190 }}>
        {coverImage ? (
          <img
            src={coverImage}
            alt={title || ""}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: "transform 0.5s ease",
            }}
            className="group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: "var(--forest2)" }}
          />
        )}
      </div>

      <div className="p-[22px]">
        <div className="flex gap-[10px] items-center mb-[10px]">
          {topic && (
            <span
              className="font-mono text-[9px] tracking-[0.14em] uppercase"
              style={{ color: "#2A5A10" }}
            >
              {TOPIC_LABELS[topic] || topic}
            </span>
          )}
          <span className="text-[10px]" style={{ color: "var(--mist)" }}>
            8 perc
          </span>
        </div>
        <h3
          className="font-display text-[20px] leading-[1.05] mb-[10px] transition-colors"
          style={{ color: "var(--ink)" }}
        >
          {title}
        </h3>
        <p
          className="text-[12px] leading-[1.7]"
          style={{ color: "var(--mist)" }}
        >
          {excerpt}
        </p>
      </div>
    </Link>
  );
}
