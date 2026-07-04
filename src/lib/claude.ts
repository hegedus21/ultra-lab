import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateArticle(params: {
  transcript: string
  videoTitle: string
  language: 'en' | 'ru'
  runnerName?: string
}): Promise<{ title_hu: string; title_en: string; excerpt_hu: string; excerpt_en: string; content_hu: string; content_en: string; topics: string[]; level: string }> {

  const prompt = `Te egy ultrafutás-szakértő szerkesztő vagy az Ultra Lab tudástár számára.

Az alábbi YouTube videó/podcast átiratából kell strukturált tudástár cikket írni.
Videó címe: "${params.videoTitle}"
${params.runnerName ? `Futó neve: ${params.runnerName}` : ''}
Átirat nyelve: ${params.language === 'ru' ? 'orosz' : 'angol'}

ÁTIRAT:
${params.transcript.slice(0, 8000)}

Készíts belőle Ultra Lab tudástár cikket. Válaszolj KIZÁRÓLAG JSON formátumban, így:
{
  "title_hu": "cím magyarul (max 80 karakter)",
  "title_en": "title in English (max 80 chars)",
  "excerpt_hu": "rövid összefoglaló magyarul 1-2 mondatban",
  "excerpt_en": "short summary in English 1-2 sentences",
  "content_hu": "teljes cikk magyarul markdown formátumban, minimum 400 szó. Tartalmazza: főbb tanulságok, konkrét tippek, idézetek a futótól ha releváns",
  "content_en": "full article in English markdown format, minimum 400 words",
  "topics": ["backyard_ultra", "nutrition", "training", "mental", "sleep", "gear", "race_strategy", "recovery"] - csak a releváns témákat add vissza,
  "level": "beginner" vagy "advanced" vagy "elite"
}`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
