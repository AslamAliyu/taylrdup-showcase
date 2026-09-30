import type { Metadata } from 'next'
import '@/styles/globals.css'
import { Providers } from './providers'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://taylrdup.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'TaylrdUp — AI Resume Tailoring for College Students',
  description: 'Tailor your resume to any job in 30 seconds. AI-powered, ATS-optimized, built for undergrads. Start free — no credit card required.',
  keywords: ['resume tailoring', 'ATS resume', 'AI resume builder', 'college student resume'],
  openGraph: {
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface">
        <div className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-xs text-center py-2 px-4">
          UI showcase: runs entirely in your browser on sample data. The AI and PDF backend are private and not included.
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
