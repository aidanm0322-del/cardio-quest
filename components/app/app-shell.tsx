'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SWRConfig } from 'swr'
import {
  Activity,
  BookHeart,
  FileText,
  HeartPulse,
  Home,
  Map,
  Menu,
  MessageCircle,
  Pill,
  Settings,
  Stethoscope,
  Users,
  X,
} from 'lucide-react'
import { PixelCharacter } from '@/components/character/pixel-character'
import { api } from '@/lib/client/api'
import { cn } from '@/lib/utils'
import { DemoBar } from './demo-bar'
import { GameProvider, usePatient } from './game-provider'
import { EmergencyButton, ErrorState, GameButton, LoadingState, XpBar } from './game-ui'

const NAV = [
  { href: '/hub', label: 'Quest Hub', icon: Home },
  { href: '/map', label: 'Journey Map', icon: Map },
  { href: '/medications', label: 'Medications', icon: Pill },
  { href: '/check-in', label: 'Symptom Check-in', icon: HeartPulse },
  { href: '/mind', label: 'Mind & Mood', icon: BookHeart },
  { href: '/companion', label: 'Companion', icon: MessageCircle },
  { href: '/care-team', label: 'Care Team', icon: Stethoscope },
  { href: '/health', label: 'Health Data', icon: Activity },
  { href: '/records', label: 'Records', icon: FileText },
  { href: '/caregiver-access', label: 'Caregiver Access', icon: Users },
  { href: '/profile', label: 'Profile & Settings', icon: Settings },
]

const MOBILE_NAV = [NAV[0], NAV[2], NAV[3], NAV[5]]

const FULLSCREEN = ['/', '/onboarding']
const OTHER_ROLES = ['/clinician', '/caregiver']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const fullscreen = FULLSCREEN.includes(pathname)
  const otherRole = OTHER_ROLES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  return (
    <SWRConfig value={{ revalidateOnFocus: false }}>
      <GameProvider>
        <a href="#main" className="sr-only z-[80] rounded-md bg-card p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
          Skip to main content
        </a>
        <DemoBar />
        {fullscreen || otherRole ? children : <PatientChrome>{children}</PatientChrome>}
      </GameProvider>
    </SWRConfig>
  )
}

function Brand() {
  return (
    <Link href="/hub" className="flex items-center gap-2.5" aria-label="Cardio Quest home">
      <Image src="/brand/cardio-quest-logo.jpg" alt="" width={40} height={40} className="size-10 rounded-md object-cover object-[50%_38%]" />
      <span className="text-xl font-extrabold tracking-tight">
        <span className="text-navy">Cardio</span> <span className="text-primary">Quest</span>
      </span>
    </Link>
  )
}

function PatientChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data, error, mutate } = usePatient()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => setMenuOpen(false), [pathname])
  useEffect(() => {
    if (data && !data.profile.onboarded) router.replace('/')
  }, [data, router])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b-2 border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted lg:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
          <Brand />
          <div className="ml-auto flex items-center gap-2">
            {data && (
              <Link href="/companion" className="hidden items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted sm:flex" aria-label={`Talk to ${data.character.name}`}>
                <PixelCharacter appearance={data.character} pose="idle" size={40} shadow={false} />
                <span className="font-semibold">{data.character.name}</span>
              </Link>
            )}
            <EmergencyButton compact />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r-2 border-border px-3 py-5 lg:flex" aria-label="Main">
          {data && (
            <div className="rounded-lg bg-muted p-3">
              <XpBar level={data.level} compact />
            </div>
          )}
          <NavList pathname={pathname} />
        </aside>

        {menuOpen && (
          <div id="mobile-nav" className="fixed inset-x-0 top-[6.5rem] bottom-0 z-30 overflow-y-auto bg-card p-4 lg:hidden">
            {data && (
              <div className="mb-4 rounded-lg bg-muted p-3">
                <XpBar level={data.level} />
              </div>
            )}
            <NavList pathname={pathname} />
          </div>
        )}

        <main id="main" className="min-w-0 flex-1 px-4 pt-6 pb-28 md:px-8 lg:pb-12">
          {pathname === '/emergency' ? (
            children
          ) : error ? (
            error.status === 403 ? (
              <RoleGate />
            ) : (
              <ErrorState message={error.message} onRetry={() => mutate()} />
            )
          ) : !data ? (
            <LoadingState />
          ) : (
            children
          )}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-card lg:hidden" aria-label="Quick">
        <ul className="grid grid-cols-4">
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? 'page' : undefined} className={cn('flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold', active ? 'text-primary' : 'text-muted-foreground')}>
                  <Icon className="size-6" aria-hidden />
                  {label.replace('Symptom ', '')}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

function NavList({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Sections">
      <ul className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-semibold',
                  active ? 'bg-navy text-navy-foreground' : 'text-foreground hover:bg-muted',
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function RoleGate() {
  const router = useRouter()
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold">You&apos;re in a different demo role</h1>
      <p className="text-lg text-muted-foreground">Patient screens are only available to the patient. Switch back using the demo bar, or below.</p>
      <GameButton
        onClick={async () => {
          await api.switchRole('patient')
          router.refresh()
          window.location.reload()
        }}
      >
        Switch to patient view
      </GameButton>
    </div>
  )
}
