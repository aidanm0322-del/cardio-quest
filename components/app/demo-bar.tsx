'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { toast } from 'sonner'
import { FlaskConical, RotateCcw } from 'lucide-react'
import { KEYS, api } from '@/lib/client/api'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

const ROLES: { role: Role; label: string; href: string }[] = [
  { role: 'patient', label: 'Patient', href: '/hub' },
  { role: 'clinician', label: 'Clinician', href: '/clinician' },
  { role: 'caregiver', label: 'Caregiver', href: '/caregiver' },
]

/** Hackathon controls. Role switching sets a demo session cookie; the server enforces access per role. */
export function DemoBar() {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const { data } = useSWR(KEYS.session, api.session)
  const [busy, setBusy] = useState(false)

  async function switchTo(role: Role, href: string) {
    setBusy(true)
    try {
      await api.switchRole(role)
      await mutate(() => true, undefined, { revalidate: true })
      router.push(href)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not switch role')
    } finally {
      setBusy(false)
    }
  }

  async function reset(firstTime: boolean) {
    if (!window.confirm(firstTime ? 'Restart as a brand-new patient? All demo data will be reset.' : 'Reset the demo patient to the seeded sample data?')) return
    setBusy(true)
    try {
      await api.reset(firstTime)
      await mutate(() => true, undefined, { revalidate: true })
      router.push(firstTime ? '/' : '/hub')
      toast.success('Demo reset')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-navy text-navy-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
        <span className="flex items-center gap-1.5 font-semibold">
          <FlaskConical className="size-4 text-gold" aria-hidden />
          Demo · fictional patient
          {data && <span className="font-normal opacity-70">({data.storage === 'postgres' ? 'database' : 'local file'} storage)</span>}
        </span>
        <div className="flex items-center gap-1" role="group" aria-label="View as">
          <span className="mr-1 opacity-70">View as</span>
          {ROLES.map((r) => (
            <button
              key={r.role}
              type="button"
              disabled={busy}
              aria-pressed={data?.role === r.role}
              onClick={() => switchTo(r.role, r.href)}
              className={cn('min-h-8 rounded-md px-2.5 font-semibold', data?.role === r.role ? 'bg-gold text-navy' : 'hover:bg-sidebar-accent')}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" disabled={busy} onClick={() => reset(false)} className="flex min-h-8 items-center gap-1.5 rounded-md px-2.5 hover:bg-sidebar-accent">
            <RotateCcw className="size-4" aria-hidden /> Reset demo
          </button>
          <button type="button" disabled={busy} onClick={() => reset(true)} className="min-h-8 rounded-md px-2.5 hover:bg-sidebar-accent">
            Start as new patient
          </button>
        </div>
      </div>
    </div>
  )
}
