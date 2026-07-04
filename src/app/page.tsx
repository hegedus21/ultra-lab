import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import TopicsGrid from "@/components/TopicsGrid";
import ArticleCard from "@/components/ArticleCard";
import Footer from "@/components/Footer";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

async function getLatestArticles() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data } = await supabase
      .from("articles")
      .select(
        "id, slug, title_hu, excerpt_hu, topics, runner_name, published_at",
      )
      .eq("status", "ai_published")
      .order("published_at", { ascending: false })
      .limit(3);
    return data || [];
  } catch {
    return [];
  }
}

async function getArticleCount() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { count } = await supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .in("status", ["published", "ai_published"]);
    return count || 0;
  } catch {
    return 0;
  }
}

export default async function HomePage() {
  const [articles, count] = await Promise.all([
    getLatestArticles(),
    getArticleCount(),
  ]);

  return (
    <>
      <Nav />
      <Hero articleCount={count} />
      <Ticker />

      {articles.length > 0 && (
        <section
          style={{ background: "var(--card)", padding: "64px 24px" }}
          className="section-pad"
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
            Legújabb cikkek
            <span
              style={{
                width: 44,
                height: 1,
                background: "#2A5A10",
                display: "block",
              }}
            />
          </div>
          <div className="articles-grid" style={{ marginBottom: 32 }}>
            {articles.map((a: any) => (
              <ArticleCard key={a.id} article={a} basePath="/ai" />
            ))}
          </div>
          <Link
            href="/ai"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#2A5A10",
              textDecoration: "none",
              borderBottom: "1px solid #2A5A10",
              paddingBottom: 3,
            }}
          >
            Összes AI cikk →
          </Link>
        </section>
      )}

      <TopicsGrid />

      <section
        style={{ background: "var(--forest2)", padding: "64px 24px" }}
        className="section-pad"
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 40,
          }}
        >
          Automatizált tartalom
          <span
            style={{
              width: 44,
              height: 1,
              background: "var(--accent)",
              display: "block",
            }}
          />
        </div>
        <div className="pipeline-grid">
          <div>
            <h2
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(28px,4vw,48px)",
                textTransform: "uppercase",
                color: "#fff",
                margin: "0 0 16px",
                lineHeight: 0.95,
              }}
            >
              Új interjú?
              <br />
              Azonnal
              <br />
              <span style={{ color: "var(--accent)" }}>tudástárrá válik.</span>
            </h2>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.85,
                fontWeight: 300,
                marginBottom: 28,
                color: "rgba(234,217,194,0.55)",
              }}
            >
              Az Ultra Lab folyamatosan figyeli a top YouTube csatornákat. Új
              tartalom megjelenésekor automatikusan feldolgozza és emailben
              értesít.
            </p>
            {[
              { name: "Backyard Ultra Podcast", lang: "EN" },
              { name: "Nikolay Kotenkov", lang: "RU" },
              { name: "Kirill Tsvetkov", lang: "RU" },
              { name: "Rich Roll", lang: "EN" },
              { name: "Diary of a CEO", lang: "EN" },
            ].map((src) => (
              <div
                key={src.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 16px",
                  marginBottom: 8,
                  background: "rgba(255,255,255,0.04)",
                  borderLeft: "3px solid var(--accent)",
                }}
              >
                <span
                  style={{ color: "var(--accent)", fontSize: 16, width: 20 }}
                >
                  ▶
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#fff",
                    }}
                  >
                    {src.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      color: "rgba(234,217,194,0.4)",
                      marginTop: 2,
                    }}
                  >
                    youtube · {src.lang}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div>
            {[
              {
                n: "01",
                title: "Forrás figyelés",
                desc: "YouTube csatornák napi automatikus ellenőrzése",
              },
              {
                n: "02",
                title: "Felirat letöltés",
                desc: "Ingyenes transcript API, nem kell API kulcs",
              },
              {
                n: "03",
                title: "Cikk generálás",
                desc: "Claude AI strukturált tudástár cikket ír",
              },
              {
                n: "04",
                title: "Email & publikálás",
                desc: "Email értesítés – te szerkesztesz, te döntesz",
              },
            ].map((step, i) => (
              <div
                key={step.n}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "16px 0",
                  borderBottom:
                    i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    fontSize: 40,
                    lineHeight: 1,
                    minWidth: 36,
                    color: "rgba(168,255,62,0.2)",
                  }}
                >
                  {step.n}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    {step.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      lineHeight: 1.65,
                      color: "rgba(234,217,194,0.45)",
                    }}
                  >
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (min-width: 768px) {
          .section-pad { padding-left: 56px !important; padding-right: 56px !important; }
          .articles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
          .pipeline-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; }
        }
        @media (max-width: 767px) {
          .articles-grid { display: flex; flex-direction: column; gap: 16px; }
          .pipeline-grid { display: flex; flex-direction: column; gap: 40px; }
        }
      `}</style>
    </>
  );
}
