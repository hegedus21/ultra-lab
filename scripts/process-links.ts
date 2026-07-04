#!/usr/bin/env tsx
/**
 * Ultra Lab – YouTube link feldolgozó
 * Használat: npx tsx scripts/process-links.ts
 */

import { YoutubeTranscript } from "youtube-transcript";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { sendArticleReviewEmail } from '../src/lib/email'

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const YOUTUBE_LINKS = [
  "https://www.youtube.com/watch?v=_nsqj2ab3Io",
  "https://www.youtube.com/watch?v=Tsic175-Qjw",
  "https://www.youtube.com/watch?v=pj3PyLQq0hA",
  "https://www.youtube.com/watch?v=nQ8aPDRYw3U",
  "https://www.youtube.com/watch?v=t9Tt2A9z7OM",
  "https://www.youtube.com/watch?v=S3LT2XfyBdo",
  "https://www.youtube.com/watch?v=X2JkDdmEIR8",
  "https://www.youtube.com/watch?v=1YWN94gb5ro",
  "https://www.youtube.com/watch?v=3iwcu6RNOes",
  "https://www.youtube.com/watch?v=-hTLVbvn5v4",
  "https://www.youtube.com/watch?v=wr-PN9O7AqI",
  "https://www.youtube.com/watch?v=YVse-ZA3cNs",
  "https://www.youtube.com/watch?v=XQj8tsNrag8",
  "https://www.youtube.com/watch?v=sWxulzEeJ6A",
  "https://www.youtube.com/watch?v=NOnsSMRZk5g",
  "https://www.youtube.com/watch?v=WeQU9lichYo",
  "https://www.youtube.com/watch?v=k77yafi6fFo",
  "https://www.youtube.com/watch?v=ihzDWsnTpzA",
  "https://www.youtube.com/watch?v=kvzKTx8wM-c",
  "https://www.youtube.com/watch?v=wwFKkKba_h8",
  "https://www.youtube.com/watch?v=noeNikVKrmA",
];

const TOPICS = [
  "backyard_ultra",
  "nutrition",
  "training",
  "mental",
  "sleep",
  "gear",
  "race_strategy",
  "recovery",
];

function extractVideoId(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

async function getVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (res.ok) {
      const data = (await res.json()) as { title: string };
      return data.title;
    }
  } catch { }
  return videoId;
}

async function getTranscript(
  videoId: string
): Promise<{ text: string; lang: string } | null> {
  const langs = [["en"], ["ru"], ["a.en"], ["a.ru"]];
  for (const lang of langs) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: lang[0],
      });
      if (transcript && transcript.length > 0) {
        const text = transcript.map((t: any) => t.text).join(" ");
        if (text.length > 300) {
          return { text, lang: lang[0].replace("a.", "") };
        }
      }
    } catch { }
  }
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (transcript && transcript.length > 0) {
      const text = transcript.map((t: any) => t.text).join(" ");
      if (text.length > 300) return { text, lang: "en" };
    }
  } catch { }
  return null;
}

async function generateArticle(
  client: Anthropic,
  transcript: string,
  title: string,
  lang: string
) {
  const prompt = `Te az Ultra Lab ultrafutás tudástár szerkesztője vagy.

Videó cím: "${title}"
Átirat nyelve: ${lang === "ru" ? "orosz" : "angol"}

ÁTIRAT:
${transcript.slice(0, 5000)}

Írj tudástár cikket. Válaszolj CSAK valid JSON-nal. Fontos: ne használj idézőjelet (") a szövegekben, helyette használj aposztrófot (') ha szükséges.

{
  "title_hu": "Cím magyarul max 70 karakter",
  "title_en": "Title in English max 70 chars",
  "excerpt_hu": "2 mondatos összefoglaló magyarul",
  "excerpt_en": "2 sentence summary in English",
  "content_hu": "Cikk magyarul 400-500 szó. Struktúra: Bevezetes, Fo tanulsagok, Strategiak, Osszefoglalas. Aposztrof ok, idezojelek nem.",
  "content_en": "Article in English 400-500 words. Same structure.",
  "topics": ["backyard_ultra","nutrition","training","mental","sleep","gear","race_strategy","recovery"],
  "level": "advanced",
  "runner_name": "Futó neve vagy null"
}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text : "";

  let text = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  if (!text.endsWith("}")) {
    const lastComma = text.lastIndexOf('",\n');
    if (lastComma > 0) {
      text =
        text.slice(0, lastComma + 1) +
        '\n  "level": "advanced",\n  "runner_name": null\n}';
    } else {
      text = text + '"}';
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    const extract = (key: string) => {
      const match = text.match(
        new RegExp(`"${key}":\\s*"((?:[^"\\\\]|\\\\.)*?)"`)
      );
      return match ? match[1] : null;
    };
    const extractArray = (key: string) => {
      const match = text.match(new RegExp(`"${key}":\\s*\\[([^\\]]+)\\]`));
      if (!match) return ["training"];
      return (
        match[1].match(/"([^"]+)"/g)?.map((s) => s.replace(/"/g, "")) || [
          "training",
        ]
      );
    };
    return {
      title_hu: extract("title_hu") || title,
      title_en: extract("title_en") || title,
      excerpt_hu: extract("excerpt_hu") || "Ultra futás tapasztalatok és stratégiák.",
      excerpt_en: extract("excerpt_en") || "Ultra running experiences and strategies.",
      content_hu: extract("content_hu") || "Tartalom feldolgozás alatt.",
      content_en: extract("content_en") || "Content being processed.",
      topics: extractArray("topics"),
      level: extract("level") || "advanced",
      runner_name: extract("runner_name"),
    };
  }
}

function slugify(text: string, videoId: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[áàäâ]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöôő]/g, "o")
    .replace(/[úùüûű]/g, "u")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  return `${slug}-${videoId}`.replace(/^-/, "");
}

async function main() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ANTHROPIC_API_KEY",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error("❌ Hiányzó .env.local értékek:", missing.join(", "));
    process.exit(1);
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.log(`\n🏃 Ultra Lab Pipeline – ${YOUTUBE_LINKS.length} link feldolgozása\n`);
  console.log("=".repeat(60));

  const results = { ok: 0, skip: 0, error: 0 };
  const log: string[] = [];

  for (let i = 0; i < YOUTUBE_LINKS.length; i++) {
    const url = YOUTUBE_LINKS[i];
    const videoId = extractVideoId(url);

    if (!videoId) {
      console.log(`\n[${i + 1}/${YOUTUBE_LINKS.length}] ❌ Érvénytelen URL: ${url}`);
      results.error++;
      continue;
    }

    console.log(`\n[${i + 1}/${YOUTUBE_LINKS.length}] 📺 ${videoId}`);

    const { data: existing } = await db
      .from("articles")
      .select("id, title_hu")
      .eq("source_url", `https://www.youtube.com/watch?v=${videoId}`)
      .single();

    if (existing) {
      console.log(`   ⏭  Már feldolgozva: ${existing.title_hu}`);
      results.skip++;
      continue;
    }

    process.stdout.write("   📝 Cím lekérés... ");
    const title = await getVideoTitle(videoId);
    console.log(title);

    process.stdout.write("   📄 Felirat letöltés... ");
    const transcriptData = await getTranscript(videoId);

    if (!transcriptData) {
      console.log("❌ Nincs felirat, kihagyva");
      log.push(`SKIP (no transcript): ${title} - ${url}`);
      results.skip++;
      continue;
    }

    console.log(`✅ ${transcriptData.text.length} karakter (${transcriptData.lang})`);

    process.stdout.write("   🤖 Claude cikk generálás... ");
    let generated: any;
    try {
      generated = await generateArticle(claude, transcriptData.text, title, transcriptData.lang);
      console.log(`✅ "${generated.title_hu}"`);
    } catch (err: any) {
      console.log(`❌ Claude hiba: ${err.message}`);
      results.error++;
      continue;
    }

    const validTopics = (generated.topics || []).filter((t: string) => TOPICS.includes(t));
    const slug = slugify(generated.title_hu || title, videoId);

    // Mentés Supabase-be – automatikusan ai_published
    const { error: dbErr } = await db.from("articles").insert({
      slug,
      title_hu: generated.title_hu,
      title_en: generated.title_en,
      excerpt_hu: generated.excerpt_hu,
      excerpt_en: generated.excerpt_en,
      content_hu: generated.content_hu,
      content_en: generated.content_en,
      topics: validTopics,
      level: generated.level || "advanced",
      runner_name: generated.runner_name || null,
      discipline: validTopics.includes("backyard_ultra") ? "backyard_ultra" : "trail_ultra",
      status: "ai_published",
      published_at: new Date().toISOString(),
      source_url: `https://www.youtube.com/watch?v=${videoId}`,
      source_type: "youtube",
    });

    if (dbErr) {
      console.log(`   ❌ DB hiba: ${dbErr.message}`);
      results.error++;
      continue;
    }

    console.log(`   ✅ Mentve → /ai szekció`);

    // Email küldés
    process.stdout.write("   📧 Email küldés... ");
    try {
      await sendArticleReviewEmail({
        videoId,
        videoTitle: title,
        title_hu: generated.title_hu,
        title_en: generated.title_en,
        excerpt_hu: generated.excerpt_hu,
        excerpt_en: generated.excerpt_en,
        content_hu: generated.content_hu,
        content_en: generated.content_en,
        topics: validTopics,
        level: generated.level || "advanced",
        runner_name: generated.runner_name || null,
        source_url: `https://www.youtube.com/watch?v=${videoId}`,
        slug,
      });
      console.log(`✅`);
    } catch (emailErr: any) {
      console.log(`⚠️  ${emailErr.message} (cikk mentve, email nem ment)`);
    }

    log.push(`OK: ${generated.title_hu}`);
    results.ok++;

    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n✅ Kész! Eredmény:`);
  console.log(`   Sikeres:    ${results.ok} cikk`);
  console.log(`   Kihagyva:   ${results.skip} (már megvolt vagy nincs felirat)`);
  console.log(`   Hiba:       ${results.error}`);
  console.log(`\n→ AI szekció: http://localhost:3000/ai\n`);

  if (log.length > 0) {
    fs.writeFileSync("pipeline-results.txt", log.join("\n"));
    console.log("📄 Részletes napló: pipeline-results.txt\n");
  }
}

main().catch((err) => {
  console.error("\n❌ Fatális hiba:", err.message);
  process.exit(1);
});