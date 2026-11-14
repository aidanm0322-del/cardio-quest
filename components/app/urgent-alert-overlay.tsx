'use client'

import { useEffect, useRef } from 'react'
import { AlertTriangle, Clock, MessageSquare, Phone, Siren } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime } from '@/lib/dates'
import type { Alert, CareTeamMember } from '@/lib/types'

/**
 * Urgent guidance. Rendered above every other overlay, appears before any AI
 * response, and never waits on network calls to show its instructions.
 */
export function UrgentAlertOverlay({ alert, careTeam, onClose }: { alert: Alert; careTeam: CareTeamMember[]; onClose: () => void }) {
  const primaryRef = useRef<HTMLAnchorElement>(null)
  const emergency = alert.severity === 'emergency'
  const nurse = careTeam.find((m) => /nurse/i.test(m.role)) ?? careTeam[0]

  useEffect(() => {
    primaryRef.current?.focus()
  }, [])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/80 p-4" role="alertdialog" aria-modal="true" aria-labelledby="alert-title" aria-describedby="alert-action">
      <div className={`flex max-h-[92vh] w-full max-w-lg flex-col gap-5 overflow-y-auto rounded-xl border-4 bg-card p-6 ${emergency ? 'border-destructive' : 'border-warning'}`}>
        {alert.simulated && (
          <p className="rounded-md bg-navy px-3 py-2 text-center text-sm font-semibold text-navy-foreground">
            SIMULATED DEMO ALERT — fictional patient. No one has been contacted.
          </p>
        )}

        <div className="flex items-start gap-3">
          <span className={`flex size-12 shrink-0 items-center justify-center rounded-full ${emergency ? 'bg-destructive text-destructive-foreground' : 'bg-warning-soft text-warning'}`}>
            {emergency ? <Siren className="size-6" aria-hidden /> : <AlertTriangle className="size-6" aria-hidden />}
          </span>
          <div className="flex flex-col gap-1">
            <p className={`text-sm font-bold tracking-wide uppercase ${emergency ? 'text-destructive' : 'text-warning'}`}>
              {emergency ? 'Seek emergency help now' : 'Contact your care team today'}
            </p>
            <h2 id="alert-title" className="text-2xl font-bold text-balance">
              {emergency ? 'This could be an emergency.' : 'This needs your care team’s attention.'}
            </h2>
          </div>
        </div>

        <dl className="grid gap-3 rounded-lg bg-muted p-4 text-base">
          <div>
            <dt className="text-sm font-semibold text-muted-foreground">What triggered this</dt>
            <dd className="font-medium">{alert.trigger}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-muted-foreground">Care-plan rule</dt>
            <dd>{alert.detail}</dd>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" aria-hidden />
            <span>Flagged {formatDateTime(alert.at)}</span>
          </div>
        </dl>

        <div id="alert-action" className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-muted-foreground">Next step</p>
          <p className="text-lg font-semibold text-pretty">{alert.action}</p>
        </div>

        <div className="flex flex-col gap-3">
          {emergency ? (
            <>
              <a ref={primaryRef} href="tel:911" className="flex items-center justify-center gap-2 rounded-lg bg-destructive px-6 py-4 text-xl font-bold text-destructive-foreground">
                <Phone className="size-6" aria-hidden /> Call 911
              </a>
              <p className="text-center text-sm text-muted-foreground">Do not drive yourself. Unlock your door and sit down while you wait.</p>
              {nurse && (
                <a href={`tel:${nurse.phone}`} className="flex items-center justify-center gap-2 rounded-lg border-2 border-border px-6 py-3 font-semibold">
                  After calling 911: notify {nurse.name} · {nurse.phone}
                </a>
              )}
            </>
          ) : (
            <>
              {nurse && (
                <a ref={primaryRef} href={`tel:${nurse.phone}`} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-lg font-bold text-primary-foreground">
                  <Phone className="size-5" aria-hidden /> Call {nurse.name} · {nurse.phone}
                </a>
              )}
              <Link href="/care-team" onClick={onClose} className="flex items-center justify-center gap-2 rounded-lg border-2 border-border px-6 py-3 font-semibold">
                <MessageSquare className="size-5" aria-hidden /> Message my care team
              </Link>
              <a href="tel:911" className="flex items-center justify-center gap-2 rounded-lg border-2 border-destructive px-6 py-3 font-semibold text-destructive">
                <Phone className="size-5" aria-hidden /> If symptoms get worse: Call 911
              </a>
            </>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {alert.simulated
            ? 'Clinician notification is simulated in this demo.'
            : 'This alert is saved to your record and visible in the demo clinician view. Cardio Quest does not monitor you continuously and cannot confirm anyone has seen it.'}
        </p>

        <button type="button" onClick={onClose} className="rounded-lg px-4 py-3 font-semibold text-muted-foreground underline-offset-4 hover:underline">
          I understand — close this message
        </button>
      </div>
    </div>
  )
}
