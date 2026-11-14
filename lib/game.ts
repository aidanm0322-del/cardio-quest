import { dayKey, formatClock } from './dates'
import type { AppState, Cosmetic, DayKey, LevelInfo, Quest, QuestKind } from './types'

/**
 * Game levels measure participation only — they are never tied to medical
 * recovery status, health readings, or taking more than prescribed.
 */
const LEVELS = [
  { at: 0, title: 'Trailhead Traveler' },
  { at: 100, title: 'Path Finder' },
  { at: 250, title: 'Steady Stepper' },
  { at: 450, title: 'Meadow Walker' },
  { at: 700, title: 'Hill Climber' },
  { at: 1000, title: 'River Ranger' },
  { at: 1350, title: 'Summit Seeker' },
  { at: 1750, title: 'Heart Hero' },
  { at: 2200, title: 'Legend of the Path' },
]

export const QUEST_XP: Record<QuestKind, number> = {
  medication: 20,
  'symptom-check-in': 30,
  'mood-check-in': 30,
  'review-instructions': 15,
  appointment: 50,
  activity: 25,
}

export const COSMETICS: Cosmetic[] = [
  { id: 'hat-flower', slot: 'hat', value: 'flower', label: 'Meadow Flower', unlockLevel: 2 },
  { id: 'hat-explorer', slot: 'hat', value: 'explorer', label: 'Explorer Hat', unlockLevel: 3 },
  { id: 'acc-heart-pin', slot: 'accessory', value: 'heart-pin', label: 'Heart Pin', unlockLevel: 3 },
  { id: 'hat-wizard', slot: 'hat', value: 'wizard', label: 'Starry Wizard Hat', unlockLevel: 4 },
  { id: 'outfit-cape', slot: 'outfit', value: 'cape-suit', label: 'Hero Cape', unlockLevel: 5 },
  { id: 'acc-medal', slot: 'accessory', value: 'medal', label: 'Golden Medal', unlockLevel: 6 },
  { id: 'hat-crown', slot: 'hat', value: 'crown', label: 'Pathfinder Crown', unlockLevel: 7 },
]

export function isLocked(slot: Cosmetic['slot'], value: string, unlocked: string[]) {
  const c = COSMETICS.find((x) => x.slot === slot && x.value === value)
  return c ? !unlocked.includes(c.id) : false
}

export function levelFor(xp: number): LevelInfo {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].at) idx = i
  const cur = LEVELS[idx]
  const next = LEVELS[idx + 1]
  const span = next ? next.at - cur.at : 500
  return {
    level: idx + 1,
    title: cur.title,
    xpIntoLevel: xp - cur.at,
    xpForLevel: span,
    nextLevelAt: next ? next.at : cur.at + span,
  }
}

export function cosmeticsUnlockedAt(level: number) {
  return COSMETICS.filter((c) => c.unlockLevel <= level)
}

export function buildQuests(state: AppState, today: DayKey): Quest[] {
  const rewarded = new Set(state.game.rewards.map((r) => r.questKey))
  const quests: Quest[] = []

  for (const med of state.medications) {
    for (const time of med.times) {
      const key = `medication:${med.id}@${time}:${today}`
      const taken = state.doseLogs.some(
        (l) => l.medId === med.id && l.time === time && l.day === today && l.status === 'taken',
      )
      quests.push({
        key,
        kind: 'medication',
        title: `Log ${med.name} · ${formatClock(time)}`,
        detail: `${med.strength} — ${med.instructions}`,
        xp: QUEST_XP.medication,
        href: '/medications',
        source: `Medication list · prescribed by ${med.prescriber}`,
        done: taken,
        dose: { medId: med.id, time },
      })
    }
  }

  quests.push({
    key: `symptom-check-in:daily:${today}`,
    kind: 'symptom-check-in',
    title: 'Complete your symptom check-in',
    detail: 'Symptoms, pain, activity, sleep, and energy — about 2 minutes.',
    xp: QUEST_XP['symptom-check-in'],
    href: '/check-in',
    source: 'Discharge instructions · daily self-check',
    done: state.healthCheckIns.some((c) => c.day === today),
  })

  quests.push({
    key: `mood-check-in:daily:${today}`,
    kind: 'mood-check-in',
    title: 'Check in with Mind & Mood',
    detail: 'Any answer counts. There are no wrong feelings.',
    xp: QUEST_XP['mood-check-in'],
    href: '/mind',
    source: 'Recovery plan · emotional wellbeing',
    done: state.moodCheckIns.some((c) => c.day === today),
  })

  const discharge = state.records.find((r) => r.type === 'discharge')
  if (discharge) {
    const key = `review-instructions:${discharge.id}:${today}`
    quests.push({
      key,
      kind: 'review-instructions',
      title: 'Review your discharge instructions',
      detail: 'A quick read of your plain-language summary.',
      xp: QUEST_XP['review-instructions'],
      href: `/records#${discharge.id}`,
      source: discharge.title,
      done: rewarded.has(key),
    })
  }

  const activityKey = `activity:assigned:${today}`
  quests.push({
    key: activityKey,
    kind: 'activity',
    title: 'Complete your assigned activity',
    detail: state.profile.assignedActivity,
    xp: QUEST_XP.activity,
    href: '/hub#quests',
    source: `${state.profile.planName} · activity`,
    done: rewarded.has(activityKey),
  })

  for (const appt of state.appointments) {
    if (dayKey(appt.at) !== today) continue
    const key = `appointment:${appt.id}:${today}`
    quests.push({
      key,
      kind: 'appointment',
      title: `Attend: ${appt.title}`,
      detail: appt.location,
      xp: QUEST_XP.appointment,
      href: '/care-team',
      source: 'Follow-up schedule',
      done: appt.attended,
    })
  }

  return quests
}

export function celebrationMessage(kind: QuestKind) {
  switch (kind) {
    case 'medication':
      return 'Medication logged — another step in your journey!'
    case 'symptom-check-in':
      return 'Check-in saved. Your care team summary is up to date.'
    case 'mood-check-in':
      return 'Thanks for checking in with yourself. Every answer counts.'
    case 'review-instructions':
      return 'Instructions reviewed. Knowledge is a trusty companion.'
    case 'appointment':
      return 'Appointment attended — your care team is on the path with you.'
    case 'activity':
      return 'Assigned activity done. Steady steps win the quest.'
  }
}
