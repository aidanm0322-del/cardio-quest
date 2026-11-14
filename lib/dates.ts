import type { DayKey, ISODate } from './types'

export const DAY_MS = 86_400_000

/** Demo timezone for "today" so quests roll over consistently. */
export const DEMO_TIMEZONE = process.env.NEXT_PUBLIC_DEMO_TIMEZONE ?? 'America/New_York'

export function dayKey(date: Date | ISODate = new Date()): DayKey {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DEMO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export function recoveryDayFor(surgeryDate: ISODate, now = new Date()) {
  const start = new Date(`${dayKey(surgeryDate)}T00:00:00Z`).getTime()
  const today = new Date(`${dayKey(now)}T00:00:00Z`).getTime()
  return Math.max(1, Math.round((today - start) / DAY_MS) + 1)
}

/** Date for a recovery day number (day 1 = surgery day). */
export function dateForRecoveryDay(surgeryDate: ISODate, day: number) {
  return new Date(new Date(surgeryDate).getTime() + (day - 1) * DAY_MS)
}

export function hourInDemoZone(now = new Date()) {
  return Number(
    new Intl.DateTimeFormat('en-US', { timeZone: DEMO_TIMEZONE, hour: 'numeric', hourCycle: 'h23' }).format(now),
  )
}

export function partOfDay(now = new Date()) {
  const h = hourInDemoZone(now)
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export function formatClock(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`
}

export function formatDateTime(iso: ISODate) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: DEMO_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDate(iso: ISODate | Date, style: 'short' | 'long' = 'short') {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: DEMO_TIMEZONE,
    ...(style === 'long'
      ? { weekday: 'long', month: 'long', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' }),
  })
}

export function formatTimeOf(iso: ISODate) {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: DEMO_TIMEZONE, hour: 'numeric', minute: '2-digit' })
}

export function timeAgo(iso: ISODate | null | undefined) {
  if (!iso) return 'Never'
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min} min ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const d = Math.round(hr / 24)
  return `${d} day${d === 1 ? '' : 's'} ago`
}

export function minutesSince(iso: ISODate | null | undefined) {
  if (!iso) return Infinity
  return (Date.now() - new Date(iso).getTime()) / 60_000
}
