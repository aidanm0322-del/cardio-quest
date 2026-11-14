import 'server-only'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { dayKey, formatClock, formatDateTime, recoveryDayFor } from '@/lib/dates'
import { matchCheckIn, matchMood, matchReading, type RuleMatch } from '@/lib/escalation'
import { buildQuests, celebrationMessage, cosmeticsUnlockedAt, isLocked, levelFor } from '@/lib/game'
import { adherence, lastNDays } from '@/lib/summary'
import type {
  Alert,
  AppState,
  CaregiverView,
  CelebrationPayload,
  ClinicianView,
  MetricType,
  PatientView,
  Quest,
  Role,
} from '@/lib/types'
import type { Action } from './schema'

export const ROLE_COOKIE = 'cq_role'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Demo session: the role lives in an httpOnly cookie set by /api/session.
 * This is NOT authentication — production must replace it with real auth
 * (e.g. Better Auth) and per-user patient records.
 */
export async function currentRole(): Promise<Role> {
  const v = (await cookies()).get(ROLE_COOKIE)?.value
  return v === 'clinician' || v === 'caregiver' ? v : 'patient'
}

export async function requireRole(...roles: Role[]) {
  const role = await currentRole()
  if (!roles.includes(role)) throw new HttpError(403, `This action requires the ${roles.join(' or ')} role.`)
  return role
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

/* ------------------------------ Views ------------------------------ */

export function patientView(state: AppState): PatientView {
  const today = dayKey()
  return {
    ...state,
    devices: state.devices.map(({ syncKeyHash: _hash, ...d }) => d),
    today,
    recoveryDay: recoveryDayFor(state.profile.surgeryDate),
    quests: buildQuests(state, today),
    level: levelFor(state.game.xp),
  }
}

export function clinicianView(state: AppState): ClinicianView {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const p = state.profile
  return {
    patient: {
      fullName: p.fullName || 'New patient',
      preferredName: p.preferredName,
      dateOfBirth: p.dateOfBirth,
      surgeryType: p.surgeryType,
      surgeryDate: p.surgeryDate,
      hospital: p.hospital,
      planName: p.planName,
    },
    recoveryDay: recoveryDayFor(p.surgeryDate),
    healthCheckIns: state.healthCheckIns.slice(-14),
    doseLogs: state.doseLogs.filter((l) => l.at >= since),
    medications: state.medications,
    readings: state.readings.filter((r) => r.at >= since),
    alerts: state.alerts,
    messages: state.messages,
    appointments: state.appointments,
    milestones: state.milestones,
    rules: state.rules,
    supportRequests: state.supportRequests,
    adherence7d: adherence(state, lastNDays(8).slice(1)),
  }
}

export function caregiverView(state: AppState): CaregiverView {
  const c = state.caregiver
  const base: CaregiverView = {
    status: c.status,
    caregiverName: c.name,
    patientName: state.profile.preferredName || 'your loved one',
    recoveryDay: recoveryDayFor(state.profile.surgeryDate),
    permissions: c.permissions,
  }
  if (c.status !== 'active') return base
  const today = dayKey()
  if (c.permissions.medications) {
    base.medications = state.medications.flatMap((m) =>
      m.times.map((time) => {
        const log = state.doseLogs.find((l) => l.medId === m.id && l.time === time && l.day === today)
        return { name: m.name, time: formatClock(time), status: log?.status ?? ('pending' as const) }
      }),
    )
    base.adherence7d = adherence(state, lastNDays(8).slice(1))
  }
  if (c.permissions.appointments) {
    base.appointments = state.appointments
      .filter((a) => !a.attended)
      .map(({ id, title, at, location }) => ({ id, title, at, location }))
  }
  if (c.permissions.milestones) {
    base.milestones = state.milestones.map(({ id, title, targetDay, completedAt }) => ({ id, title, targetDay, completedAt }))
  }
  if (c.permissions.healthUpdates) {
    const latest = [...state.healthCheckIns].sort((a, b) => b.at.localeCompare(a.at))[0]
    const bp = state.readings.filter((r) => r.metric === 'bloodPressure').sort((a, b) => b.at.localeCompare(a.at))[0]
    base.healthUpdates = [
      ...(latest ? [{ label: 'Latest check-in', value: `Pain ${latest.pain}/10 · energy ${latest.energy}/5`, at: latest.at }] : []),
      ...(bp ? [{ label: 'Blood pressure', value: `${bp.value}/${bp.value2} mmHg`, at: bp.at }] : []),
    ]
  }
  return base
}

/* ------------------------------ Rewards ------------------------------ */

function award(state: AppState, quest: Quest): CelebrationPayload | undefined {
  if (state.game.rewards.some((r) => r.questKey === quest.key)) return undefined
  const levelBefore = levelFor(state.game.xp).level
  state.game.xp += quest.xp
  state.game.rewards.push({ id: uid('rw'), questKey: quest.key, title: quest.title, xp: quest.xp, at: new Date().toISOString() })
  const level = levelFor(state.game.xp)
  const unlocked = cosmeticsUnlockedAt(level.level).filter((c) => !state.game.unlocked.includes(c.id))
  state.game.unlocked.push(...unlocked.map((c) => c.id))
  return { questTitle: quest.title, message: celebrationMessage(quest.kind), xpEarned: quest.xp, levelBefore, level, unlocked }
}

/** Corrections remove the reward without any penalty beyond the original XP. */
function revoke(state: AppState, questKey: string) {
  const idx = state.game.rewards.findIndex((r) => r.questKey === questKey)
  if (idx === -1) return
  state.game.xp = Math.max(0, state.game.xp - state.game.rewards[idx].xp)
  state.game.rewards.splice(idx, 1)
}

function questByKey(state: AppState, key: string) {
  return buildQuests(state, dayKey()).find((q) => q.key === key)
}

function raise(state: AppState, match: RuleMatch, source: Alert['source'], simulated = false): Alert {
  const alert: Alert = {
    id: uid('alert'),
    at: new Date().toISOString(),
    ruleId: match.rule.id,
    severity: match.rule.severity,
    trigger: match.trigger,
    detail: match.rule.condition,
    action: match.rule.action,
    source,
    simulated,
    acknowledged: false,
  }
  state.alerts.unshift(alert)
  return alert
}

/* ------------------------------ Actions ------------------------------ */

type Outcome = { celebration?: CelebrationPayload; alert?: Alert; syncKey?: string }

const APPLE_ID = 'dev-apple'
const hashKey = (key: string) => createHash('sha256').update(key).digest('hex')

function appleDevice(state: AppState) {
  const dev = state.devices.find((d) => d.id === APPLE_ID)
  if (!dev) throw new HttpError(404, 'Apple Health is not set up for this patient.')
  return dev
}

/** Verify a Shortcuts sync key in constant time. */
export function verifySyncKey(state: AppState, key: string) {
  const stored = state.devices.find((d) => d.id === APPLE_ID)?.syncKeyHash
  if (!stored || !key) return false
  const a = Buffer.from(hashKey(key), 'hex')
  const b = Buffer.from(stored, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

export interface HealthSample {
  metric: MetricType
  value: number
  value2?: number
  label: string
}

/** Store samples pushed from Apple Health and run them through the safety rules. */
export function ingestAppleSamples(state: AppState, samples: HealthSample[], at: string) {
  const dev = appleDevice(state)
  const units: Record<MetricType, string> = { heartRate: 'bpm', bloodPressure: 'mmHg', oxygen: '%', steps: 'steps' }
  const alerts: Alert[] = []
  for (const s of samples) {
    const reading = {
      id: uid('rd'),
      metric: s.metric,
      value: s.value,
      value2: s.value2,
      unit: units[s.metric],
      at,
      source: { kind: 'device' as const, name: s.label },
    }
    if (s.metric === 'steps') {
      // Step totals grow through the day; keep one Apple reading per day.
      const day = dayKey(new Date(at))
      state.readings = state.readings.filter(
        (r) => !(r.metric === 'steps' && r.source.name === s.label && dayKey(new Date(r.at)) === day),
      )
    }
    state.readings.push(reading)
    const m = matchReading(reading, state.rules)
    if (m) alerts.push(raise(state, m, 'reading'))
  }
  dev.lastSync = new Date().toISOString()
  return alerts
}

const PATIENT_ONLY = new Set<Action['type']>([
  'onboarding.complete',
  'profile.update',
  'settings.update',
  'character.save',
  'dose.log',
  'dose.undo',
  'med.update',
  'checkin.health',
  'checkin.mood',
  'journal.add',
  'journal.delete',
  'quest.complete',
  'quest.undo',
  'record.review',
  'reading.add',
  'device.toggle',
  'device.sync',
  'healthsync.createKey',
  'healthsync.revoke',
  'milestone.toggle',
  'goal.add',
  'goal.update',
  'goal.remove',
  'message.send',
  'support.request',
  'caregiver.invite',
  'caregiver.permissions',
  'caregiver.revoke',
  'caregiver.simulateAccept',
  'alert.ack',
  'demo.urgent',
  'chat.clear',
])

const CLINICIAN_ONLY = new Set<Action['type']>(['clinician.reply', 'clinician.markRead', 'clinician.adjustMilestone', 'clinician.ackAlert'])

export async function authorize(action: Action) {
  if (PATIENT_ONLY.has(action.type)) return requireRole('patient')
  if (CLINICIAN_ONLY.has(action.type)) return requireRole('clinician')
  throw new HttpError(400, 'Unknown action')
}

export function applyAction(state: AppState, action: Action): Outcome {
  const now = new Date().toISOString()
  const today = dayKey()

  switch (action.type) {
    case 'onboarding.complete': {
      Object.assign(state.profile, action.profile, { onboarded: true })
      state.character = sanitizeCharacter(state, action.character)
      return {}
    }
    case 'profile.update': {
      Object.assign(state.profile, action.patch)
      return {}
    }
    case 'settings.update': {
      Object.assign(state.profile.settings, action.patch)
      return {}
    }
    case 'character.save': {
      state.character = sanitizeCharacter(state, action.character)
      return {}
    }
    case 'dose.log': {
      const med = state.medications.find((m) => m.id === action.medId)
      if (!med || !med.times.includes(action.time)) throw new HttpError(404, 'That dose is not on your schedule.')
      const existing = state.doseLogs.find((l) => l.medId === med.id && l.time === action.time && l.day === today)
      const key = `medication:${med.id}@${action.time}:${today}`
      const wasTaken = existing?.status === 'taken'
      const entry = {
        id: existing?.id ?? uid('dose'),
        medId: med.id,
        day: today,
        time: action.time,
        status: action.status,
        at: now,
        snoozeUntil: action.status === 'snoozed' ? new Date(Date.now() + (action.snoozeMinutes ?? 30) * 60_000).toISOString() : undefined,
      }
      if (existing) Object.assign(existing, entry)
      else state.doseLogs.push(entry)
      if (action.status === 'taken' && !wasTaken) med.supply.onHand = Math.max(0, med.supply.onHand - med.supply.perDose)
      if (action.status !== 'taken' && wasTaken) {
        med.supply.onHand += med.supply.perDose
        revoke(state, key)
      }
      if (action.status === 'taken') {
        const quest = questByKey(state, key)
        return { celebration: quest ? award(state, quest) : undefined }
      }
      return {}
    }
    case 'dose.undo': {
      const idx = state.doseLogs.findIndex((l) => l.id === action.logId)
      if (idx === -1) throw new HttpError(404, 'Dose log not found.')
      const log = state.doseLogs[idx]
      if (log.day !== today) throw new HttpError(400, 'Only today’s entries can be corrected here. Message your care team about older entries.')
      const med = state.medications.find((m) => m.id === log.medId)
      if (log.status === 'taken' && med) med.supply.onHand += med.supply.perDose
      revoke(state, `medication:${log.medId}@${log.time}:${today}`)
      state.doseLogs.splice(idx, 1)
      return {}
    }
    case 'med.update': {
      const med = state.medications.find((m) => m.id === action.medId)
      if (!med) throw new HttpError(404, 'Medication not found.')
      if (action.reminders) Object.assign(med.reminders, action.reminders)
      if (action.onHand !== undefined) med.supply.onHand = action.onHand
      return {}
    }
    case 'checkin.health': {
      const existing = state.healthCheckIns.find((c) => c.day === today)
      const entry = { id: existing?.id ?? uid('hc'), day: today, at: now, ...action.data }
      if (existing) Object.assign(existing, entry)
      else state.healthCheckIns.push(entry)
      const matches = matchCheckIn(entry, state.rules)
      const alert = matches[0] ? raise(state, matches[0], 'check-in') : undefined
      for (const m of matches.slice(1)) raise(state, m, 'check-in')
      const quest = questByKey(state, `symptom-check-in:daily:${today}`)
      return { alert, celebration: quest ? award(state, quest) : undefined }
    }
    case 'checkin.mood': {
      const existing = state.moodCheckIns.find((c) => c.day === today)
      const entry = { id: existing?.id ?? uid('mc'), day: today, at: now, ...action.data }
      if (existing) Object.assign(existing, entry)
      else state.moodCheckIns.push(entry)
      const m = matchMood(entry, state.rules)
      const alert = m ? raise(state, m, 'check-in') : undefined
      const quest = questByKey(state, `mood-check-in:daily:${today}`)
      return { alert, celebration: quest ? award(state, quest) : undefined }
    }
    case 'journal.add': {
      state.journal.unshift({ id: uid('j'), at: now, prompt: action.prompt ?? null, text: action.text })
      const m = matchMood({ note: action.text }, state.rules)
      return { alert: m ? raise(state, m, 'check-in') : undefined }
    }
    case 'journal.delete': {
      state.journal = state.journal.filter((j) => j.id !== action.id)
      return {}
    }
    case 'quest.complete': {
      const quest = questByKey(state, action.key)
      if (!quest) throw new HttpError(404, 'Quest not found for today.')
      if (quest.kind === 'appointment') {
        const appt = state.appointments.find((a) => quest.key.startsWith(`appointment:${a.id}:`))
        if (appt) appt.attended = true
      }
      if (!['activity', 'review-instructions', 'appointment'].includes(quest.kind))
        throw new HttpError(400, 'Complete this quest from its own screen.')
      return { celebration: award(state, quest) }
    }
    case 'quest.undo': {
      const quest = questByKey(state, action.key)
      if (quest?.kind === 'appointment') {
        const appt = state.appointments.find((a) => quest.key.startsWith(`appointment:${a.id}:`))
        if (appt) appt.attended = false
      }
      revoke(state, action.key)
      return {}
    }
    case 'record.review': {
      const rec = state.records.find((r) => r.id === action.recordId)
      if (!rec) throw new HttpError(404, 'Record not found.')
      rec.reviewedAt = now
      if (rec.type !== 'discharge') return {}
      const quest = questByKey(state, `review-instructions:${rec.id}:${today}`)
      return { celebration: quest ? award(state, quest) : undefined }
    }
    case 'reading.add': {
      const unit = { heartRate: 'bpm', bloodPressure: 'mmHg', oxygen: '%', steps: 'steps' }[action.metric]
      const reading = {
        id: uid('rd'),
        metric: action.metric,
        value: action.value,
        value2: action.value2,
        unit,
        at: now,
        source: { kind: 'manual' as const, name: 'Entered by patient' },
      }
      state.readings.push(reading)
      const m = matchReading(reading, state.rules)
      return { alert: m ? raise(state, m, 'reading') : undefined }
    }
    case 'healthsync.createKey': {
      const dev = appleDevice(state)
      const key = `cq_${randomBytes(24).toString('base64url')}`
      dev.syncKeyHash = hashKey(key)
      dev.syncKeyHint = key.slice(-4)
      dev.status = 'connected'
      return { syncKey: key }
    }
    case 'healthsync.revoke': {
      const dev = appleDevice(state)
      dev.syncKeyHash = null
      dev.syncKeyHint = null
      dev.status = 'disconnected'
      return {}
    }
    case 'device.toggle': {
      const dev = state.devices.find((d) => d.id === action.deviceId)
      if (!dev) throw new HttpError(404, 'Device not found.')
      if (dev.id === APPLE_ID) throw new HttpError(400, 'Use the Apple Watch setup steps to connect Apple Health.')
      if (dev.status === 'not-implemented') throw new HttpError(400, `${dev.name} is not implemented in this prototype.`)
      dev.status = action.connect ? 'connected' : 'disconnected'
      return {}
    }
    case 'device.sync': {
      const dev = state.devices.find((d) => d.id === action.deviceId)
      if (!dev || dev.status !== 'connected') throw new HttpError(400, 'Connect the device before syncing.')
      if (dev.id === APPLE_ID) throw new HttpError(400, 'Run the Cardio Quest shortcut on your iPhone to sync Apple Health.')
      // Simulated sync: append a plausible demo reading for each supported metric.
      for (const metric of dev.metrics) {
        if (metric === 'heartRate')
          state.readings.push({ id: uid('rd'), metric, value: 68 + Math.round(Math.random() * 10), unit: 'bpm', at: now, source: { kind: 'device', name: `${dev.name} (demo)` } })
        if (metric === 'oxygen')
          state.readings.push({ id: uid('rd'), metric, value: 95 + Math.round(Math.random() * 3), unit: '%', at: now, source: { kind: 'device', name: `${dev.name} (demo)` } })
      }
      dev.lastSync = now
      return {}
    }
    case 'milestone.toggle': {
      const m = state.milestones.find((x) => x.id === action.id)
      if (!m) throw new HttpError(404, 'Milestone not found.')
      m.completedAt = action.done ? now : null
      return {}
    }
    case 'goal.add': {
      state.profile.goals.push({ id: uid('goal'), ...action.goal })
      return {}
    }
    case 'goal.update': {
      const g = state.profile.goals.find((x) => x.id === action.id)
      if (!g) throw new HttpError(404, 'Goal not found.')
      Object.assign(g, action.patch)
      return {}
    }
    case 'goal.remove': {
      state.profile.goals = state.profile.goals.filter((g) => g.id !== action.id)
      return {}
    }
    case 'message.send': {
      state.messages.push({
        id: uid('msg'),
        from: 'patient',
        author: state.profile.fullName || state.profile.preferredName || 'Patient',
        body: action.body,
        at: now,
        attachments: action.attachments,
        readByClinician: false,
      })
      return {}
    }
    case 'support.request': {
      state.supportRequests.unshift({ id: uid('sr'), at: now, topic: action.topic, note: action.note })
      state.messages.push({
        id: uid('msg'),
        from: 'patient',
        author: state.profile.fullName || 'Patient',
        body: `Support request — ${action.topic}${action.note ? `: ${action.note}` : ''}`,
        at: now,
        attachments: [],
        readByClinician: false,
      })
      return {}
    }
    case 'caregiver.invite': {
      state.caregiver = { ...state.caregiver, ...action.caregiver, status: 'invited', invitedAt: now }
      return {}
    }
    case 'caregiver.permissions': {
      state.caregiver.permissions = action.permissions
      return {}
    }
    case 'caregiver.revoke': {
      state.caregiver.status = 'revoked'
      return {}
    }
    case 'caregiver.simulateAccept': {
      if (state.caregiver.status !== 'invited') throw new HttpError(400, 'There is no pending invitation.')
      state.caregiver.status = 'active'
      return {}
    }
    case 'alert.ack': {
      const a = state.alerts.find((x) => x.id === action.id)
      if (a) a.acknowledged = true
      return {}
    }
    case 'demo.urgent': {
      const rule = state.rules.find((r) => r.id === 'chest-pain')!
      return {
        alert: raise(state, { rule, trigger: 'DEMO: fictional patient reported chest pressure spreading to the left arm' }, 'demo', true),
      }
    }
    case 'chat.clear': {
      state.chat = []
      return {}
    }
    case 'clinician.reply': {
      state.messages.push({ id: uid('msg'), from: 'clinician', author: action.author, body: action.body, at: now, attachments: [], readByClinician: true })
      for (const m of state.messages) m.readByClinician = true
      return {}
    }
    case 'clinician.markRead': {
      for (const m of state.messages) m.readByClinician = true
      return {}
    }
    case 'clinician.adjustMilestone': {
      const m = state.milestones.find((x) => x.id === action.id)
      if (!m) throw new HttpError(404, 'Milestone not found.')
      m.targetDay = action.targetDay
      return {}
    }
    case 'clinician.ackAlert': {
      const a = state.alerts.find((x) => x.id === action.id)
      if (a) a.acknowledged = true
      return {}
    }
  }
}

function sanitizeCharacter(state: AppState, c: AppState['character']) {
  const locked =
    isLocked('hat', c.hat, state.game.unlocked) ||
    isLocked('accessory', c.accessory, state.game.unlocked) ||
    isLocked('outfit', c.outfit, state.game.unlocked)
  if (locked) throw new HttpError(400, 'That item is still locked. Keep questing to unlock it!')
  return c
}

export function describeAlertForChat(alert: Alert) {
  return `${alert.severity === 'emergency' ? 'This could be an emergency.' : 'This needs your care team’s attention.'} ${alert.action} (Rule: ${alert.trigger}, ${formatDateTime(alert.at)}.)`
}
