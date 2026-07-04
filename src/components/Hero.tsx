import Link from "next/link";

interface HeroProps {
  articleCount?: number;
}

export default function Hero({ articleCount = 0 }: HeroProps) {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        overflow: "hidden",
        background: "var(--forest)",
      }}
    >
      <img
        src="/hero.jpg"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 30%",
          opacity: 0.45,
          pointerEvents: "none",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(15,26,18,.1) 0%, rgba(15,26,18,.6) 55%, rgba(15,26,18,.97) 100%)",
        }}
      />

      <div
        style={{ position: "relative", padding: "0 24px 64px" }}
        className="hero-content"
      >
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              width: 28,
              height: 1,
              background: "var(--accent)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          Ultra Lab · tudástár
        </p>

        <h1
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(56px, 13vw, 152px)",
            lineHeight: 0.88,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
            color: "#fff",
            margin: 0,
          }}
        >
          Menj
          <br />
          tovább.
          <br />
          Tudj
          <br />
          <em style={{ fontStyle: "italic", color: "var(--accent)" }}>
            többet.
          </em>
        </h1>

        <div className="hero-bottom">
          <div>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.75,
                fontWeight: 300,
                marginBottom: 28,
                color: "rgba(234,217,194,0.75)",
              }}
            >
              Az ultrafutás legmélyebb tudása egy helyen. Top futók stratégiái
              és bevált módszerei.
            </p>
            <Link
              href="/cikkek"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--accent)",
                textDecoration: "none",
                borderBottom: "1px solid var(--accent)",
                paddingBottom: 3,
              }}
            >
              Tudástár megnyitása →
            </Link>
          </div>
          <div className="hero-kpis">
            {[
              {
                num: articleCount > 0 ? `${articleCount}+` : "21+",
                label: "Interjú",
              },
              { num: "8", label: "Témakör" },
              { num: "∞", label: "Yard" },
            ].map((s) => (
              <div key={s.label}>
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    fontSize: 36,
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  {s.num}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(102,112,112,0.8)",
                    marginTop: 4,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .hero-content { padding: 0 56px 80px !important; }
          .hero-bottom { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; gap: 40px; }
          .hero-kpis { display: flex; gap: 44px; flex-shrink: 0; }
        }
        @media (max-width: 767px) {
          .hero-bottom { display: flex; flex-direction: column; gap: 28px; margin-top: 28px; }
          .hero-kpis { display: flex; gap: 28px; }
        }
      `}</style>
    </section>
  );
}
