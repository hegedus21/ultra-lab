import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ultra-lab-eight.vercel.app"),
  title: {
    default: "Ultra Lab – Ultrafutás Tudástár",
    template: "%s | Ultra Lab",
  },
  description:
    "Top ultrafutók stratégiái, tapasztalatai és bevált módszerei egy helyen. Backyard Ultra, trail ultra és többnapos verseny tudástár magyarul.",
  keywords: [
    "ultrafutás",
    "backyard ultra",
    "trail futás",
    "ultramaraton",
    "felkészülés",
    "táplálkozás",
    "mentális stratégia",
  ],
  authors: [{ name: "Ultra Lab" }],
  openGraph: {
    type: "website",
    locale: "hu_HU",
    url: "https://ultra-lab-eight.vercel.app",
    siteName: "Ultra Lab",
    title: "Ultra Lab – Ultrafutás Tudástár",
    description:
      "Top ultrafutók stratégiái, tapasztalatai és bevált módszerei egy helyen.",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Ultra Lab – Ultrafutás Tudástár",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ultra Lab – Ultrafutás Tudástár",
    description:
      "Top ultrafutók stratégiái, tapasztalatai és bevált módszerei egy helyen.",
    images: ["/og-default.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <body className="antialiased">{children}</body>
    </html>
  );
}
