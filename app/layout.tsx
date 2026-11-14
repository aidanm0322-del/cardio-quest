import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Pixelify_Sans, Plus_Jakarta_Sans } from 'next/font/google'
import { AppShell } from '@/components/app/app-shell'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })
const pixelify = Pixelify_Sans({ subsets: ['latin'], variable: '--font-pixelify' })

export const metadata: Metadata = {
  title: 'Cardio Quest — Your journey towards better living',
  description:
    'A pixel-art recovery companion for heart surgery patients. Complete daily care quests, track medications and symptoms, and stay connected to your care team.',
  generator: 'v0.app',
  icons: { icon: '/brand/cardio-quest-logo.jpg', apple: '/brand/cardio-quest-logo.jpg' },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0B2D5B',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-text-size="standard" className={`bg-background ${jakarta.variable} ${pixelify.variable}`}>
      <body className="antialiased">
        <AppShell>{children}</AppShell>
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
