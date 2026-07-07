import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { RaceType, Topic, Level } from "./taxonomy";

const CONTENT_DIR = path.join(process.cwd(), "content", "articles");

export interface ArticleFrontmatter {
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  athlete: string;
  athleteCountry: string;
  sourceLang: "en" | "ru";
  raceTypes: RaceType[];
  topics: Topic[];
  level: Level;
  loopNumber: number;
  coverImage?: string;
}

export interface Article extends ArticleFrontmatter {
  lang: "hu" | "en";
  content: string;
}

export function getAllArticles(lang: "hu" | "en"): Article[] {
  const dir = path.join(CONTENT_DIR, lang);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

  const articles = files.map((filename) => {
    const filePath = path.join(dir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    return {
      ...(data as ArticleFrontmatter),
      lang,
      content,
    };
  });

  return articles.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getArticleBySlug(
  lang: "hu" | "en",
  slug: string
): Article | null {
  const articles = getAllArticles(lang);
  return articles.find((a) => a.slug === slug) ?? null;
}

export function getAllSlugs(lang: "hu" | "en"): string[] {
  return getAllArticles(lang).map((a) => a.slug);
}
