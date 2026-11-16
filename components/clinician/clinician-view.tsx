'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { AlertTriangle, Check, Send, Sparkles } from 'lucide-react'
import { ErrorState, GameButton, LoadingState, Panel, Tag } from '@/components/app/game-ui'
import { api, KEYS, type Action, type ApiError } from '@/lib/client/api'
import { formatDate, formatDateTime } from '@/lib/dates'
import type { ClinicianView as View } from '@/lib/types'
import { cn } from '@/lib/utils'

const AUTHOR = 'Nurse Priya Shah, RN'

export function ClinicianView() {
  const { data, error, mutate } = useSWR<View, ApiError>(KEYS.clinician, api.clinician, { shouldRetryOnError: false })
  const [reply, setReply] = useState('')
  const [summary, setSummary] = useState<string | null>(null)
  const [summarizing, setSummarizing] = useState(false)

  async function act(action: Action, success?: string) {
    try {
      const res = await api.clinicianAct(action)
      mutate(res.view, { revalidate: false })
      if (success) toast.success(success)
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    }
  }

  if (error) return <Wrap>{error.status === 403 ? <ErrorState message="Sign in with the clinician password (Clinician in the demo bar) to see this dashboard." /> : <ErrorState message={error.message} onRetry={() => mutate()} />}</Wrap>
  if (!data) return <Wrap><LoadingState label="Loading patient chart…" /></Wrap>

  const openAlerts = data.alerts.filter((a) => !a.acknowledged)
  const latestCheckIn = [...data.healthCheckIns].sort((a, b) => b.at.localeCompare(a.at))[0]
  const unread = data.messages.filter((m) => m.from === 'patient' && !m.readByClinician).length

  return (
    <Wrap>
      <header className="flex flex-col gap-1">
        <p className="font-semibold text-primary">Clinician dashboard · {data.patient.hospital}</p>
        <h1 className="text-3xl font-extrabold text-balance">{data.patient.fullName}</h1>
        <p className="text-muted-foreground">
          {data.patient.surgeryType} · Surgery {formatDate(data.patient.surgeryDate)} · Day {data.recoveryDay} · DOB {data.patient.dateOfBirth}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Open alerts" value={String(openAlerts.length)} tone={openAlerts.length ? 'red' : 'green'} />
        <Stat label="7-day adherence" value={`${data.adherence7d.pct}%`} tone={data.adherence7d.pct >= 80 ? 'green' : 'gold'} detail={`${data.adherence7d.taken}/${data.adherence7d.scheduled} doses`} />
        <Stat label="Last pain score" value={latestCheckIn ? `${latestCheckIn.pain}/10` : '—'} tone="blue" detail={latestCheckIn ? formatDateTime(latestCheckIn.at) : 'No check-ins'} />
      </div>

      <Panel title="Alerts">
        {data.alerts.length === 0 ? (
          <p className="text-muted-foreground">No alerts.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {[...data.alerts]
              .sort((a, b) => b.at.localeCompare(a.at))
              .map((a) => (
                <li key={a.id} className={cn('flex flex-col gap-2 rounded-lg border-2 p-3 sm:flex-row sm:items-start', a.acknowledged ? 'border-border opacity-70' : a.severity === 'emergency' ? 'border-destructive bg-heart-soft' : 'border-gold')}>
                  <AlertTriangle className={cn('size-5 shrink-0', a.severity === 'emergency' ? 'text-destructive' : 'text-gold-foreground')} aria-hidden />
                  <div className="flex-1">
                    <p className="font-bold">
                      {a.trigger} {a.simulated && <Tag tone="demo">Simulated</Tag>}
                    </p>
                    <p className="text-sm">{a.detail}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(a.at)} · via {a.source} · {a.severity}
                    </p>
                  </div>
                  {!a.acknowledged ? (
                    <GameButton variant="secondary" className="min-h-10 px-3" onClick={() => act({ type: 'clinician.ackAlert', id: a.id }, 'Alert acknowledged')}>
                      <Check aria-hidden /> Acknowledge
                    </GameButton>
                  ) : (
                    <Tag tone="green">Acknowledged</Tag>
                  )}
                </li>
              ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Messages"
          action={
            <div className="flex gap-2">
              {unread > 0 && <Tag tone="red">{unread} unread</Tag>}
              {unread > 0 && (
                <button type="button" className="text-sm font-semibold text-primary underline" onClick={() => act({ type: 'clinician.markRead' })}>
                  Mark read
                </button>
              )}
            </div>
          }
        >
          <ol className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {data.messages.map((m) => (
              <li key={m.id} className={cn('rounded-lg p-3', m.from === 'patient' ? 'bg-muted' : 'border-2 border-border')}>
                <p className="text-sm font-semibold">
                  {m.author} · {formatDateTime(m.at)}
                </p>
                <p className="whitespace-pre-wrap">{m.body}</p>
                {m.attachments.map((a, i) => (
                  <p key={i} className="mt-1 text-sm text-muted-foreground">
                    Attached: {a.label}
                  </p>
                ))}
              </li>
            ))}
          </ol>
          <div className="mt-3">
            <GameButton
              variant="secondary"
              className="min-h-10 px-3"
              disabled={summarizing}
              onClick={async () => {
                setSummarizing(true)
                try {
                  const r = await api.summarizeThread()
                  setSummary(r.summary)
                } catch (e) {
                  toast.error((e as Error).message)
                } finally {
                  setSummarizing(false)
                }
              }}
            >
              <Sparkles aria-hidden /> {summarizing ? 'Summarizing…' : 'Summarize thread'}
            </GameButton>
            {summary && <p className="mt-2 rounded-lg bg-accent p-3 text-sm whitespace-pre-wrap">{summary}</p>}
          </div>
          <form
            className="mt-3 flex flex-col gap-2 border-t-2 border-border pt-3"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!reply.trim()) return
              if (await act({ type: 'clinician.reply', body: reply.trim(), author: AUTHOR }, 'Reply sent')) setReply('')
            }}
          >
            <label htmlFor="reply" className="font-semibold">
              Reply as {AUTHOR}
            </label>
            <textarea id="reply" rows={3} className="cq-input" value={reply} onChange={(e) => setReply(e.target.value)} maxLength={4000} />
            <GameButton type="submit" disabled={!reply.trim()} className="self-start">
              <Send aria-hidden /> Send
            </GameButton>
          </form>
        </Panel>

        <Panel title="Milestone plan">
          <ul className="flex flex-col gap-2">
            {[...data.milestones]
              .sort((a, b) => a.targetDay - b.targetDay)
              .map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-lg border-2 border-border p-2.5">
                  <div className="flex-1">
                    <p className="font-semibold">{m.title}</p>
                    <p className="text-sm text-muted-foreground">{m.completedAt ? `Done ${formatDate(m.completedAt)}` : m.category}</p>
                  </div>
                  <label className="flex items-center gap-1.5 text-sm">
                    Day
                    <input
                      type="number"
                      min={1}
                      max={365}
                      defaultValue={m.targetDay}
                      className="cq-input w-20 py-1"
                      aria-label={`Target day for ${m.title}`}
                      onBlur={(e) => {
                        const v = Number(e.target.value)
                        if (v >= 1 && v <= 365 && v !== m.targetDay) act({ type: 'clinician.adjustMilestone', id: m.id, targetDay: v }, 'Milestone updated')
                      }}
                    />
                  </label>
                </li>
              ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent check-ins">
          <ul className="flex flex-col gap-2">
            {[...data.healthCheckIns]
              .sort((a, b) => b.at.localeCompare(a.at))
              .slice(0, 6)
              .map((c) => (
                <li key={c.id} className="border-b-2 border-border pb-2 last:border-0">
                  <p className="font-semibold">
                    {formatDateTime(c.at)} · Pain {c.pain}/10
                  </p>
                  <p className="text-sm">Symptoms: {c.symptoms.join(', ')} · Activity: {c.activity}</p>
                  {c.notes && <p className="text-sm text-muted-foreground">“{c.notes}”</p>}
                </li>
              ))}
          </ul>
        </Panel>
        <Panel title="Escalation rules (reviewed)">
          <ul className="flex flex-col gap-2">
            {data.rules.map((r) => (
              <li key={r.id} className="text-sm">
                <p className="font-semibold">
                  {r.label} <Tag tone={r.severity === 'emergency' ? 'red' : 'gold'}>{r.severity}</Tag>
                </p>
                <p>{r.condition}</p>
                <p className="text-muted-foreground">Reviewed by {r.reviewedBy}</p>
              </li>
            ))}
          </ul>
          {data.supportRequests.length > 0 && (
            <>
              <h3 className="mt-4 font-bold">Support requests</h3>
              <ul className="mt-1 flex flex-col gap-1 text-sm">
                {data.supportRequests.map((s) => (
                  <li key={s.id}>
                    {formatDate(s.at)} · {s.topic}
                    {s.note && ` — ${s.note}`}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>
      <p className="text-sm text-muted-foreground">This view intentionally excludes the patient&apos;s journal, companion conversations, and game progress.</p>
    </Wrap>
  )
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8">
      {children}
    </main>
  )
}

function Stat({ label, value, detail, tone }: { label: string; value: string; detail?: string; tone: 'red' | 'green' | 'gold' | 'blue' }) {
  return (
    <div className="pixel-frame flex flex-col gap-1 bg-card p-4">
      <p className="font-semibold text-muted-foreground">{label}</p>
      <p className={cn('font-pixel text-3xl', tone === 'red' && 'text-destructive', tone === 'green' && 'text-success', tone === 'gold' && 'text-gold-foreground', tone === 'blue' && 'text-primary')}>{value}</p>
      {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
    </div>
  )
}
