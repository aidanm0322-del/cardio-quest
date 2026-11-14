'use client'

import { AlarmClock, BellOff, BellRing, Check, Package, RotateCcw, SkipForward } from 'lucide-react'
import { useGame, usePatient } from '@/components/app/game-provider'
import { GameButton, PageHeader, Panel, Tag } from '@/components/app/game-ui'
import { formatClock, formatTimeOf } from '@/lib/dates'
import { adherence, lastNDays } from '@/lib/summary'
import type { DoseLog, Medication } from '@/lib/types'
import { cn } from '@/lib/utils'

export function MedicationsView() {
  const data = usePatient().data!
  const week = adherence(data, lastNDays(7))
  const todayLogs = data.doseLogs.filter((l) => l.day === data.today)
  const schedule = data.medications
    .flatMap((m) => m.times.map((t) => ({ med: m, time: t, log: latest(todayLogs, m.id, t) })))
    .sort((a, b) => a.time.localeCompare(b.time))
  const taken = schedule.filter((s) => s.log?.status === 'taken').length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Medications" description="Your prescribed schedule from your discharge plan. Log each dose to earn XP. Never change a dose without talking to your care team." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Taken today" value={`${taken} of ${schedule.length}`} />
        <Stat label="Last 7 days" value={`${week.pct}%`} hint={`${week.taken} of ${week.scheduled} doses`} />
        <Stat label="Refills needed" value={String(data.medications.filter((m) => daysLeft(m) <= m.supply.refillAlertDays).length)} />
      </div>

      <Panel title="Today's schedule">
        <ul className="flex flex-col gap-3">
          {schedule.map(({ med, time, log }) => (
            <DoseRow key={`${med.id}-${time}`} med={med} time={time} log={log} />
          ))}
        </ul>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {data.medications.map((m) => (
          <MedCard key={m.id} med={m} />
        ))}
      </div>
    </div>
  )
}

function latest(logs: DoseLog[], medId: string, time: string) {
  return logs.filter((l) => l.medId === medId && l.time === time).sort((a, b) => b.at.localeCompare(a.at))[0]
}

function daysLeft(m: Medication) {
  const perDay = m.supply.perDose * m.times.length
  return perDay > 0 ? Math.floor(m.supply.onHand / perDay) : Infinity
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="pixel-frame bg-card p-4">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="font-pixel text-3xl text-navy">{value}</p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  )
}

function DoseRow({ med, time, log }: { med: Medication; time: string; log?: DoseLog }) {
  const { run } = useGame()
  const snoozed = log?.status === 'snoozed' && log.snoozeUntil && new Date(log.snoozeUntil) > new Date()
  const settled = log && log.status !== 'snoozed'
  return (
    <li className={cn('flex flex-col gap-3 rounded-xl border-2 p-4 md:flex-row md:items-center', log?.status === 'taken' ? 'border-success/40 bg-success-soft' : 'border-border')}>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="w-20 shrink-0 font-pixel text-xl text-navy">{formatClock(time)}</span>
        <div className="min-w-0">
          <p className="text-lg font-bold">
            {med.name} <span className="font-normal text-muted-foreground">{med.strength}</span>
          </p>
          <p className="text-muted-foreground">{med.instructions}</p>
          {log && (
            <p className="mt-1 text-sm font-semibold">
              {log.status === 'taken' && <span className="text-success">Taken at {formatTimeOf(log.at)}</span>}
              {log.status === 'skipped' && <span className="text-warning">Skipped at {formatTimeOf(log.at)}</span>}
              {log.status === 'snoozed' && log.snoozeUntil && <span>Snoozed until {formatTimeOf(log.snoozeUntil)}</span>}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {settled ? (
          <button type="button" onClick={() => run({ type: 'dose.undo', logId: log.id }, { success: 'Dose log undone' })} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border-2 border-border px-3 font-semibold hover:bg-muted">
            <RotateCcw className="size-4" aria-hidden /> Undo
          </button>
        ) : (
          <>
            <GameButton onClick={() => run({ type: 'dose.log', medId: med.id, time, status: 'taken' })} className="min-h-11 px-4">
              <Check aria-hidden /> Taken
            </GameButton>
            {!snoozed && (
              <GameButton variant="secondary" onClick={() => run({ type: 'dose.log', medId: med.id, time, status: 'snoozed', snoozeMinutes: 30 }, { success: 'Reminder snoozed for 30 minutes' })} className="min-h-11 px-4">
                <AlarmClock aria-hidden /> Snooze 30m
              </GameButton>
            )}
            <GameButton variant="secondary" onClick={() => run({ type: 'dose.log', medId: med.id, time, status: 'skipped' }, { success: 'Dose marked as skipped' })} className="min-h-11 px-4">
              <SkipForward aria-hidden /> Skip
            </GameButton>
          </>
        )}
      </div>
    </li>
  )
}

function MedCard({ med }: { med: Medication }) {
  const { run } = useGame()
  const left = daysLeft(med)
  const low = left <= med.supply.refillAlertDays
  return (
    <Panel title={`${med.name} ${med.strength}`} action={low ? <Tag tone="red">Refill soon</Tag> : <Tag tone="green">{left} days left</Tag>}>
      <dl className="grid gap-3">
        <div>
          <dt className="text-sm font-semibold text-muted-foreground">What it&apos;s for</dt>
          <dd>{med.purpose}</dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-muted-foreground">How to take it</dt>
          <dd>
            {med.instructions} · {med.times.map(formatClock).join(', ')}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-muted-foreground">Prescribed by</dt>
          <dd>{med.prescriber}</dd>
        </div>
      </dl>

      <div className={cn('mt-4 flex items-center gap-3 rounded-lg p-3', low ? 'bg-heart-soft' : 'bg-muted')}>
        <Package className="size-5 shrink-0" aria-hidden />
        <p className="flex-1">
          {med.supply.onHand} on hand{low ? ' — call your pharmacy to refill.' : '.'}
        </p>
        <label className="flex items-center gap-2 text-sm font-semibold">
          Update count
          <input
            type="number"
            min={0}
            max={1000}
            defaultValue={med.supply.onHand}
            onBlur={(e) => {
              const v = Math.max(0, Math.min(1000, Number(e.target.value) || 0))
              if (v !== med.supply.onHand) run({ type: 'med.update', medId: med.id, onHand: v }, { success: 'Supply updated' })
            }}
            className="cq-input min-h-10 w-20 py-1"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={med.reminders.enabled}
          onClick={() => run({ type: 'med.update', medId: med.id, reminders: { enabled: !med.reminders.enabled } }, { success: med.reminders.enabled ? 'Reminders off' : 'Reminders on' })}
          className={cn('inline-flex min-h-11 items-center gap-2 rounded-lg border-2 px-3 font-semibold', med.reminders.enabled ? 'border-primary bg-accent text-accent-foreground' : 'border-border')}
        >
          {med.reminders.enabled ? <BellRing className="size-5" aria-hidden /> : <BellOff className="size-5" aria-hidden />}
          Reminders {med.reminders.enabled ? 'on' : 'off'}
        </button>
        {med.reminders.enabled && (
          <label className="flex items-center gap-2 font-semibold">
            Remind me
            <select
              className="cq-input min-h-11 w-auto py-1"
              value={med.reminders.leadMinutes}
              onChange={(e) => run({ type: 'med.update', medId: med.id, reminders: { leadMinutes: Number(e.target.value) } }, { quiet: true })}
            >
              {[0, 10, 15, 30, 60].map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? 'at dose time' : `${m} min before`}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Demo: reminders are saved settings. Push notifications aren&apos;t sent in this prototype.</p>
    </Panel>
  )
}
