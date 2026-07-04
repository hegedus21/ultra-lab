import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { Resend } from 'resend'
import { EMAIL_RECIPIENTS, EMAIL_FROM } from '../../config/email-recipients'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface ArticleEmailData {
  videoId: string
  videoTitle: string
  title_hu: string
  title_en: string
  excerpt_hu: string
  excerpt_en: string
  content_hu: string
  content_en: string
  topics: string[]
  level: string
  runner_name: string | null
  source_url: string
  slug: string
}

function markdownToFilename(title: string, videoId: string): string {
  return title
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i').replace(/[óòöôő]/g, 'o')
    .replace(/[úùüûű]/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50) + '-' + videoId
}

export async function sendArticleReviewEmail(data: ArticleEmailData) {
  const filename = markdownToFilename(data.title_hu, data.videoId)

  const mdContent = `---
title_hu: "${data.title_hu}"
title_en: "${data.title_en}"
excerpt_hu: "${data.excerpt_hu}"
excerpt_en: "${data.excerpt_en}"
topics: [${data.topics.map(t => `"${t}"`).join(', ')}]
level: "${data.level}"
runner_name: "${data.runner_name || ''}"
source_url: "${data.source_url}"
date: "${new Date().toISOString().split('T')[0]}"
---

${data.content_hu}

---

## English version

${data.content_en}
`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; color: #111; }
    .header { background: #0F1A12; padding: 24px; margin-bottom: 32px; }
    .logo { font-size: 22px; font-weight: 900; color: white; letter-spacing: 0.1em; }
    .logo span { color: #E05C22; }
    .badge { display: inline-block; padding: 3px 10px; font-size: 11px; font-weight: 600;
             letter-spacing: 0.1em; text-transform: uppercase; background: #E05C22; color: white; margin-bottom: 12px; }
    .title { font-size: 26px; font-weight: 900; margin: 0 0 8px; }
    .title-en { font-size: 16px; color: #666; margin: 0 0 20px; }
    .meta { display: flex; gap: 20px; font-size: 12px; color: #888; margin-bottom: 24px; flex-wrap: wrap; }
    .meta span { display: flex; align-items: center; gap: 4px; }
    .excerpt { font-size: 15px; line-height: 1.7; color: #444; border-left: 3px solid #E05C22;
               padding-left: 16px; margin: 0 0 32px; }
    .source-btn { display: inline-block; padding: 10px 20px; background: #111; color: white;
                  text-decoration: none; font-weight: 600; font-size: 13px; margin-right: 10px; }
    .ai-notice { display: inline-block; padding: 10px 20px; background: #f0fdf4;
                 border: 1px solid #86efac; color: #166534; font-size: 13px; font-weight: 600; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 32px 0; }
    .md-box { background: #f8f9fa; border: 1px solid #e5e7eb; padding: 20px;
              font-family: monospace; font-size: 12px; line-height: 1.6; white-space: pre-wrap;
              word-break: break-all; max-height: 400px; overflow-y: auto; }
    .filename { font-size: 12px; color: #E05C22; font-family: monospace; margin-bottom: 8px; }
    .instructions { background: #f0fdf4; border: 1px solid #86efac; padding: 16px;
                    font-size: 13px; line-height: 1.7; margin-bottom: 24px; }
    .instructions code { background: #dcfce7; padding: 2px 6px; font-family: monospace; font-size: 12px; }
    .footer { font-size: 11px; color: #aaa; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Ultra<span>Lab</span></div>
  </div>

  <div class="badge">Új cikk – AI szekció</div>
  <h1 class="title">${data.title_hu}</h1>
  <p class="title-en">${data.title_en}</p>

  <div class="meta">
    <span>🎯 ${data.topics.join(', ')}</span>
    <span>📊 ${data.level}</span>
    ${data.runner_name ? `<span>🏃 ${data.runner_name}</span>` : ''}
    <span>📅 ${new Date().toLocaleDateString('hu-HU')}</span>
  </div>

  <div class="excerpt">${data.excerpt_hu}</div>

  <a href="${data.source_url}" class="source-btn">▶ Forrás megtekintése</a>
  <span class="ai-notice">✅ Automatikusan megjelent az /ai szekcióban</span>

  <hr class="divider">

  <div class="instructions">
    <strong>Ha szerkesztve szeretnéd a főoldalra is:</strong><br>
    1. Másold ki az alábbi markdown tartalmat<br>
    2. Mentsd el: <code>content/articles/${filename}.md</code><br>
    3. Szerkeszd kedved szerint<br>
    4. <code>git add . && git commit -m "cikk: ${data.title_hu}" && git push</code><br>
    5. Vercel automatikusan deploy-ol → megjelenik a főoldalon
  </div>

  <div>
    <div class="filename">📄 content/articles/${filename}.md</div>
    <div class="md-box">${mdContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </div>

  <div class="footer">
    Ultra Lab Pipeline · ${new Date().toISOString()} · <a href="${data.source_url}">${data.source_url}</a>
  </div>
</body>
</html>
`

  const results = []
  for (const to of EMAIL_RECIPIENTS) {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `[Ultra Lab] Új cikk: ${data.title_hu}`,
      html,
    })
    results.push(result)
  }

  return results
}