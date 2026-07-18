#!/usr/bin/env tsx
import * as dotenv from "dotenv"
import * as path from "path"
dotenv.config({ path: path.join(process.cwd(), ".env.local") })

import { getTranscript } from '../src/lib/youtube'

const proxySet = !!process.env.YT_PROXY_URL
console.log('YT_PROXY_URL beallitva:', proxySet)

const videoId = process.argv[2] || 'iG9CE55wbtY' // TED-Ed: Do schools kill creativity (has captions)

const start = Date.now()
getTranscript(videoId).then((r) => {
  const ms = Date.now() - start
  if (r) {
    console.log(`OK (${ms}ms) lang=${r.lang} chars=${r.text.length}`)
    console.log('preview:', r.text.slice(0, 120))
  } else {
    console.log(`NULL result (${ms}ms) - nincs felirat vagy blokkolva`)
  }
  process.exit(0)
}).catch((e) => {
  console.error('ERROR', e)
  process.exit(1)
})
