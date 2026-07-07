import Header from "@/components/Header";
import SearchAndFilter from "@/components/SearchAndFilter";
import { getAllArticles } from "@/lib/content";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tudástár – Minden cikk egy helyen",
  description:
    "Szerkesztett, validált ultrafutás cikkek. Felkészülés, táplálkozás, mentális stratégia, felszerelés és versenyeredmények top futóktól.",
  openGraph: {
    title: "Tudástár | Ultra Lab",
    description:
      "Szerkesztett ultrafutás cikkek – felkészülés, táplálkozás, mentális stratégia.",
  },
};

export default function CikkekPage() {
  const articles = getAllArticles("hu");

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-16">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-moss)]">
            Tudástár
          </span>
          <h1 className="font-display text-3xl md:text-4xl text-[var(--color-bone)] mt-3 mb-10">
            Minden cikk egy helyen
          </h1>
          <SearchAndFilter articles={articles} />
        </section>
      </main>
    </>
  );
}
