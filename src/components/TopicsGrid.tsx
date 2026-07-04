import Link from "next/link";

const TOPICS = [
  {
    key: "backyard_ultra",
    label: "Backyard Ultra",
    color: "#1A5C0A",
    num: "01",
  },
  { key: "nutrition", label: "Táplálkozás", color: "#2A5FA5", num: "02" },
  { key: "training", label: "Felkészülés", color: "#2A7A4A", num: "03" },
  { key: "mental", label: "Mentális stratégia", color: "#5B3EA8", num: "04" },
  { key: "sleep", label: "Alvásmenedzsment", color: "#8A3A2A", num: "05" },
  { key: "gear", label: "Felszerelés", color: "#1A6B6B", num: "06" },
  {
    key: "race_strategy",
    label: "Versenynapi taktika",
    color: "#6B5010",
    num: "07",
  },
  { key: "recovery", label: "Regeneráció", color: "#3A5E2A", num: "08" },
];

export default function TopicsGrid({
  counts = {},
}: {
  counts?: Record<string, number>;
}) {
  return (
    <section
      style={{ background: "var(--chalk)", padding: "64px 24px" }}
      className="section-pad"
      id="topics"
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#2A5A10",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 40,
        }}
      >
        Témakörök
        <span
          style={{
            width: 44,
            height: 1,
            background: "#2A5A10",
            display: "block",
          }}
        />
      </div>
      <div className="topics-grid">
        {TOPICS.map((topic) => (
          <Link
            key={topic.key}
            href={`/cikkek?tema=${topic.key}`}
            className="topic-card"
            style={{
              display: "block",
              padding: "20px 18px",
              background: "var(--card)",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: 16,
                color: "#fff",
                background: topic.color,
              }}
            >
              {topic.num}
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800,
                fontSize: 16,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--ink)",
                marginBottom: 4,
                wordBreak: "break-word",
                hyphens: "auto",
              }}
            >
              {topic.label}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: "var(--mist)",
                letterSpacing: "0.1em",
              }}
            >
              {counts[topic.key] || 0} cikk
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .topics-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
          .section-pad { padding-left: 56px !important; padding-right: 56px !important; }
        }
        @media (max-width: 767px) {
          .topics-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
        }
        .topic-card { transition: background 0.2s, transform 0.2s; }
        .topic-card:hover { background: var(--ink) !important; transform: translateY(-3px); }
        .topic-card:hover div { color: rgba(255,255,255,0.9) !important; }
      `}</style>
    </section>
  );
}
