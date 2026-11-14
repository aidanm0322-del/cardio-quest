import { DAY_MS, dayKey, formatDateTime, recoveryDayFor } from './dates'
import { SYMPTOM_LABELS } from './escalation'
import type { AppState, Attachment } from './types'

/**
 * Deterministic summaries built straight from saved data — no AI — so what
 * the patient previews is exactly what the care team receives.
 */

export function lastNDays(n: number, now = new Date()) {
  return Array.from({ length: n }, (_, i) => dayKey(new Date(now.getTime() - i * DAY_MS)))
}

export function adherence(state: Pick<AppState, 'medications' | 'doseLogs'>, days: string[]) {
  let scheduled = 0
  let taken = 0
  for (const day of days) {
    for (const med of state.medications) {
      for (const time of med.times) {
        scheduled++
        if (state.doseLogs.some((l) => l.medId === med.id && l.time === time && l.day === day && l.status === 'taken'))
          taken++
      }
    }
  }
  return { scheduled, taken, pct: scheduled ? Math.round((taken / scheduled) * 100) : 0 }
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

export function buildRecoverySummary(state: AppState, now = new Date()): Attachment {
  const day = recoveryDayFor(state.profile.surgeryDate, now)
  const week = lastNDays(7, now)
  const pastWeek = lastNDays(8, now).slice(1)
  const adh = adherence(state, pastWeek)
  const checkIns = state.healthCheckIns.filter((c) => week.includes(c.day))
  const latest = [...state.healthCheckIns].sort((a, b) => b.at.localeCompare(a.at))[0]
  const painAvg = avg(checkIns.map((c) => c.pain))
  const bp = state.readings.filter((r) => r.metric === 'bloodPressure').sort((a, b) => b.at.localeCompare(a.at))[0]
  const hrWeek = state.readings.filter((r) => r.metric === 'heartRate' && week.includes(dayKey(r.at))).map((r) => r.value)
  const hrAvg = avg(hrWeek)
  const openAlerts = state.alerts.filter((a) => !a.acknowledged)
  const next = state.appointments.filter((a) => !a.attended && a.at > now.toISOString()).sort((a, b) => a.at.localeCompare(b.at))[0]

  const lines = [
    `Recovery day ${day} after ${state.profile.surgeryType}.`,
    `Medications (past 7 days): ${adh.taken} of ${adh.scheduled} scheduled doses logged as taken (${adh.pct}%).`,
    `Check-ins this week: ${checkIns.length} of 7${painAvg !== null ? ` · average pain ${painAvg.toFixed(1)}/10` : ''}.`,
  ]
  if (latest) {
    const symptoms = latest.symptoms.filter((s) => s !== 'none').map((s) => SYMPTOM_LABELS[s])
    lines.push(
      `Latest check-in (${formatDateTime(latest.at)}): pain ${latest.pain}/10, ${symptoms.length ? `symptoms: ${symptoms.join(', ')}` : 'no new symptoms'}, energy ${latest.energy}/5, sleep ${latest.sleep}/5.`,
    )
    if (latest.notes) lines.push(`Patient note: “${latest.notes}”`)
  }
  if (bp) lines.push(`Latest blood pressure: ${bp.value}/${bp.value2} mmHg (${bp.source.name}, ${formatDateTime(bp.at)}).`)
  if (hrAvg !== null) lines.push(`Average heart rate this week: ${Math.round(hrAvg)} bpm (device data).`)
  lines.push(
    openAlerts.length
      ? `Open concerns: ${openAlerts.map((a) => a.trigger).join('; ')}.`
      : 'No open concerns flagged by care-plan rules.',
  )
  if (next) lines.push(`Next appointment: ${next.title} on ${formatDateTime(next.at)}.`)

  return { kind: 'recovery-summary', label: `Recovery summary · Day ${day}`, lines }
}

export function buildMoodSummary(state: AppState, now = new Date()): Attachment {
  const week = lastNDays(7, now)
  const entries = state.moodCheckIns.filter((m) => week.includes(m.day))
  const f = (k: 'mood' | 'stress' | 'energy' | 'sleep') => {
    const a = avg(entries.map((e) => e[k]))
    return a === null ? '—' : `${a.toFixed(1)}/5`
  }
  return {
    kind: 'mood-summary',
    label: 'Mind & Mood summary · past 7 days',
    lines: [
      `Mood check-ins completed: ${entries.length} of 7.`,
      `Average mood ${f('mood')} · stress ${f('stress')} · energy ${f('energy')} · sleep ${f('sleep')}.`,
      'Journal entries are private and not included.',
    ],
  }
}
