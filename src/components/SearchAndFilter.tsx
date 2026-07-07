"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import type { Article } from "@/lib/content";
import { ALL_RACE_TYPES, ALL_TOPICS, RaceType, Topic } from "@/lib/taxonomy";
import ArticleCard from "./ArticleCard";

export default function SearchAndFilter({ articles }: { articles: Article[] }) {
  const [query, setQuery] = useState("");
  const [raceType, setRaceType] = useState<RaceType | "all">("all");
  const [topic, setTopic] = useState<Topic | "all">("all");

  const fuse = useMemo(
    () =>
      new Fuse(articles, {
        keys: ["title", "excerpt", "athlete"],
        threshold: 0.35,
      }),
    [articles],
  );

  const filtered = useMemo(() => {
    let base = query.trim() ? fuse.search(query).map((r) => r.item) : articles;
    if (raceType !== "all") {
      base = base.filter((a) => a.raceTypes.includes(raceType));
    }
    if (topic !== "all") {
      base = base.filter((a) => a.topics.includes(topic));
    }
    return base;
  }, [query, raceType, topic, fuse, articles]);

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Keresés cím, kivonat vagy futó neve alapján…"
          className="flex-1 border border-[var(--color-line)] px-4 py-3 text-[var(--ink)] placeholder:text-[var(--mist)] focus:border-[#2A5A10] outline-none font-mono text-sm bg-white"
        />
        <select
          value={raceType}
          onChange={(e) => setRaceType(e.target.value as RaceType | "all")}
          className="border border-[var(--color-line)] px-4 py-3 text-[var(--ink)] font-mono text-sm focus:border-[#2A5A10] outline-none bg-white"
        >
          <option value="all">Minden versenytípus</option>
          {ALL_RACE_TYPES.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.labelHu}
            </option>
          ))}
        </select>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value as Topic | "all")}
          className="border border-[var(--color-line)] px-4 py-3 text-[var(--ink)] font-mono text-sm focus:border-[#2A5A10] outline-none bg-white"
        >
          <option value="all">Minden téma</option>
          {ALL_TOPICS.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.labelHu}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="font-mono text-sm text-[var(--color-bone-muted)] py-12 text-center border border-dashed border-[var(--color-line)]">
          Nincs találat ezzel a szűréssel — próbálj más kulcsszót vagy
          kategóriát.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
