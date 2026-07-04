import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ultra Lab – Ultrafutás Tudástár',
  description: 'Top ultrafutók stratégiái, tapasztalatai és bevált módszerei egy helyen. Backyard Ultra és trail ultra specifikus tudástár.',
  openGraph: {
    title: 'Ultra Lab',
    description: 'Menj tovább. Tudj többet.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body className="antialiased">{children}</body>
    </html>
  )
}
