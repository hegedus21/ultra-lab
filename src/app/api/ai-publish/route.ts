import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const secret = searchParams.get('secret')

  if (!id || secret !== process.env.AI_PUBLISH_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase
    .from('articles')
    .update({ status: 'ai_published', published_at: new Date().toISOString() })
    .eq('id', id)

  return new Response(`
    <html><body style="font-family:system-ui;text-align:center;padding:60px">
      <h1 style="color:#2A7A4A">✅ Kész!</h1>
      <p>A cikk megjelent az <a href="/ai">/ai szekcióban</a>.</p>
    </body></html>
  `, { headers: { 'Content-Type': 'text/html' } })
}
