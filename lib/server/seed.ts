import 'server-only'
import { DAY_MS, dayKey } from '@/lib/dates'
import { DEFAULT_RULES } from '@/lib/escalation'
import type {
  AppState,
  CharacterAppearance,
  DoseLog,
  HealthCheckIn,
  Level5,
  MoodCheckIn,
  Reading,
} from '@/lib/types'

/** Every person, record, and reading below is fictional demo data. */

export const STATE_VERSION = 3

export const APPLE_HEALTH_NOTE = 'Apple Watch readings arrive through an Apple Shortcut on your iPhone.'

// Deterministic pseudo-random so the demo looks the same after every reset.
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export const DEFAULT_CHARACTER: CharacterAppearance = {
  name: 'Sunny',
  skin: 'golden',
  hairStyle: 'bun',
  hairColor: 'silver',
  eyeColor: 'brown',
  outfit: 'jacket',
  outfitColor: 'blue',
  pantsColor: 'navy',
  shoes: 'sneakers',
  shoeColor: 'red',
  hat: 'none',
  glasses: 'round',
  accessory: 'scarf',
}

export const STARTER_CHARACTER: CharacterAppearance = {
  name: 'Pip',
  skin: 'peach',
  hairStyle: 'short',
  hairColor: 'brown',
  eyeColor: 'brown',
  outfit: 'tunic',
  outfitColor: 'red',
  pantsColor: 'navy',
  shoes: 'boots',
  shoeColor: 'charcoal',
  hat: 'none',
  glasses: 'none',
  accessory: 'none',
}

const at = (now: number, dayOffset: number, hh: number, mm = 0) => {
  const d = new Date(now + dayOffset * DAY_MS)
  d.setHours(hh, mm, 0, 0)
  return d.toISOString()
}

export function createSeed(options: { firstTime?: boolean } = {}): AppState {
  const now = Date.now()
  const rand = rng(42)
  const surgeryDate = at(now, -21, 7, 30)
  const daysAgo = (n: number) => dayKey(new Date(now - n * DAY_MS))

  const medications: AppState['medications'] = [
    {
      id: 'med-aspirin',
      name: 'Aspirin',
      strength: '81 mg tablet',
      instructions: 'Take 1 tablet by mouth once daily with breakfast.',
      purpose: 'Helps keep your bypass grafts open (antiplatelet).',
      times: ['08:00'],
      supply: { onHand: 42, perDose: 1, refillAlertDays: 7 },
      reminders: { enabled: true, leadMinutes: 0 },
      prescriber: 'Dr. Priya Raman',
    },
    {
      id: 'med-metoprolol',
      name: 'Metoprolol tartrate',
      strength: '25 mg tablet',
      instructions: 'Take 1 tablet by mouth twice daily, morning and evening.',
      purpose: 'Helps control heart rate and rhythm (beta blocker).',
      times: ['08:00', '20:00'],
      supply: { onHand: 9, perDose: 1, refillAlertDays: 7 },
      reminders: { enabled: true, leadMinutes: 15 },
      prescriber: 'Dr. Marcus Bell',
    },
    {
      id: 'med-atorvastatin',
      name: 'Atorvastatin',
      strength: '40 mg tablet',
      instructions: 'Take 1 tablet by mouth every evening.',
      purpose: 'Lowers cholesterol to protect your heart (statin).',
      times: ['20:00'],
      supply: { onHand: 25, perDose: 1, refillAlertDays: 7 },
      reminders: { enabled: true, leadMinutes: 0 },
      prescriber: 'Dr. Marcus Bell',
    },
    {
      id: 'med-furosemide',
      name: 'Furosemide',
      strength: '20 mg tablet',
      instructions: 'Take 1 tablet by mouth each morning. Weigh yourself before taking.',
      purpose: 'Helps your body remove extra fluid (diuretic).',
      times: ['08:00'],
      supply: { onHand: 11, perDose: 1, refillAlertDays: 5 },
      reminders: { enabled: false, leadMinutes: 0 },
      prescriber: 'Dr. Priya Raman',
    },
  ]

  const doseLogs: DoseLog[] = []
  for (let d = 20; d >= 1; d--) {
    for (const med of medications) {
      for (const time of med.times) {
        const roll = rand()
        const status = roll > 0.95 ? 'skipped' : 'taken'
        const [hh, mm] = time.split(':').map(Number)
        doseLogs.push({
          id: `dose-${med.id}-${time}-${d}`,
          medId: med.id,
          day: daysAgo(d),
          time,
          status,
          at: at(now, -d, hh, mm + Math.floor(rand() * 40)),
        })
      }
    }
  }

  const healthCheckIns: HealthCheckIn[] = []
  for (let d = 18; d >= 1; d--) {
    const progress = (18 - d) / 18
    healthCheckIns.push({
      id: `hc-${d}`,
      day: daysAgo(d),
      at: at(now, -d, 9, 30),
      symptoms: d > 12 ? ['fatigue'] : d === 6 ? ['swelling'] : ['none'],
      pain: Math.max(1, Math.round(6 - progress * 4 + (rand() - 0.5))),
      activity: d > 14 ? 'rested' : d > 6 ? 'light' : 'assigned-walk',
      sleep: Math.min(5, Math.max(1, Math.round(2 + progress * 2 + (rand() - 0.5)))) as Level5,
      energy: Math.min(5, Math.max(1, Math.round(2 + progress * 2 + (rand() - 0.5)))) as Level5,
      notes: d === 6 ? 'Ankles a little puffy in the evening. Elevated my feet.' : '',
    })
  }

  const moodCheckIns: MoodCheckIn[] = []
  for (let d = 14; d >= 1; d--) {
    const p = (14 - d) / 14
    const wobble = d === 9 ? -1.5 : 0
    const v = (base: number) => Math.min(5, Math.max(1, Math.round(base + p * 1.6 + wobble + (rand() - 0.5)))) as Level5
    moodCheckIns.push({
      id: `mc-${d}`,
      day: daysAgo(d),
      at: at(now, -d, 19, 0),
      mood: v(2.6),
      stress: Math.min(5, Math.max(1, Math.round(3.6 - p * 1.6 - wobble + (rand() - 0.5)))) as Level5,
      energy: v(2.2),
      sleep: v(2.4),
      note: '',
    })
  }

  const readings: Reading[] = []
  for (let h = 24 * 30; h >= 1; h -= 2) {
    const t = now - h * 3_600_000
    const day = h / 24
    readings.push({
      id: `hr-${h}`,
      metric: 'heartRate',
      value: Math.round(74 - (30 - day) * 0.15 + (rand() - 0.5) * 10),
      unit: 'bpm',
      at: new Date(t).toISOString(),
      source: { kind: 'device', name: 'Fitbit Charge (demo)' },
    })
  }
  for (let d = 21; d >= 0; d--) {
    readings.push({
      id: `bp-${d}`,
      metric: 'bloodPressure',
      value: Math.round(132 - (21 - d) * 0.6 + (rand() - 0.5) * 8),
      value2: Math.round(82 - (21 - d) * 0.3 + (rand() - 0.5) * 6),
      unit: 'mmHg',
      at: at(now, -d, 8, 15),
      source: { kind: 'manual', name: 'Home cuff · entered by patient' },
    })
    if (d >= 3) {
      readings.push({
        id: `ox-${d}`,
        metric: 'oxygen',
        value: Math.round(95 + rand() * 3),
        unit: '%',
        at: at(now, -d, 8, 20),
        source: { kind: 'device', name: 'Pulse oximeter (demo)' },
      })
    }
    if (d >= 1) {
      readings.push({
        id: `steps-${d}`,
        metric: 'steps',
        value: Math.round(900 + (21 - d) * 140 + rand() * 400),
        unit: 'steps',
        at: at(now, -d, 21, 0),
        source: { kind: 'device', name: 'Fitbit Charge (demo)' },
      })
    }
  }

  const state: AppState = {
    version: STATE_VERSION,
    profile: {
      onboarded: !options.firstTime,
      preferredName: options.firstTime ? '' : 'Maggie',
      fullName: options.firstTime ? '' : 'Margaret Alvarez',
      dateOfBirth: '1961-04-12',
      surgeryType: 'Coronary artery bypass graft (CABG ×3)',
      surgeryDate,
      hospital: 'Riverbend Heart Institute (fictional)',
      recoveryWeeks: 12,
      planName: 'Cardiac Recovery Plan · Phase 2',
      assignedActivity: 'Walk 10–15 minutes at an easy, talking pace — twice today (Week 4 walking plan).',
      goals: options.firstTime
        ? []
        : [
            { id: 'goal-school', title: 'Walk my granddaughter to school', category: 'personal', targetDay: 35 },
            { id: 'goal-garden', title: 'Plant the spring garden', category: 'hobby', targetDay: 45 },
            { id: 'goal-work', title: 'Return to the library part-time', category: 'career', targetDay: 60 },
            { id: 'goal-dance', title: 'Rejoin Thursday salsa class', category: 'hobby', targetDay: 90 },
          ],
      settings: { showWelcome: true, reduceMotion: false, soundOn: false, textSize: 'large' },
    },
    character: options.firstTime ? STARTER_CHARACTER : DEFAULT_CHARACTER,
    game: {
      xp: options.firstTime ? 0 : 430,
      unlocked: options.firstTime ? [] : ['hat-flower', 'hat-explorer', 'acc-heart-pin'],
      rewards: options.firstTime
        ? []
        : Array.from({ length: 6 }, (_, i) => ({
            id: `rw-seed-${i}`,
            questKey: `symptom-check-in:daily:${daysAgo(i + 1)}`,
            title: 'Complete your symptom check-in',
            xp: 30,
            at: at(now, -(i + 1), 9, 30),
          })),
    },
    careTeam: [
      {
        id: 'ct-raman',
        name: 'Dr. Priya Raman',
        role: 'Cardiothoracic surgeon',
        organization: 'Riverbend Heart Institute',
        phone: '(555) 014-2200',
        bio: 'Performed your bypass surgery and oversees your surgical recovery plan.',
        responseTime: 'Replies within 1 business day',
      },
      {
        id: 'ct-lee',
        name: 'Jordan Lee, RN',
        role: 'Cardiac nurse navigator',
        organization: 'Riverbend Heart Institute',
        phone: '(555) 014-2200',
        bio: 'Your first point of contact for questions about wounds, medications, and daily recovery.',
        responseTime: 'Replies same business day',
      },
      {
        id: 'ct-bell',
        name: 'Dr. Marcus Bell',
        role: 'Cardiologist',
        organization: 'Riverbend Cardiology',
        phone: '(555) 014-3100',
        bio: 'Manages your heart medications and long-term heart health.',
        responseTime: 'Replies within 2 business days',
      },
      {
        id: 'ct-cho',
        name: 'Alana Cho, PT',
        role: 'Cardiac rehab therapist',
        organization: 'Riverbend Cardiac Rehab',
        phone: '(555) 014-4400',
        bio: 'Guides your activity plan and cardiac rehabilitation sessions.',
        responseTime: 'Replies within 1 business day',
      },
    ],
    medications,
    doseLogs,
    healthCheckIns,
    moodCheckIns,
    journal: options.firstTime
      ? []
      : [
          {
            id: 'j-1',
            at: at(now, -3, 20, 10),
            prompt: 'What is one small thing that went well today?',
            text: 'Made it to the mailbox and back without stopping. Lucia cheered from the porch.',
          },
        ],
    readings,
    devices: [
      {
        id: 'dev-fitbit',
        name: 'Fitbit',
        kind: 'watch',
        status: 'connected',
        metrics: ['heartRate', 'steps'],
        lastSync: new Date(now - 40 * 60_000).toISOString(),
        note: 'Demo connection with simulated data. Real sync needs Fitbit Web API OAuth.',
      },
      {
        id: 'dev-oximeter',
        name: 'Pulse oximeter',
        kind: 'oximeter',
        status: 'disconnected',
        metrics: ['oxygen'],
        lastSync: at(now, -3, 8, 20),
        note: 'Bluetooth pairing not implemented in this prototype. Enter readings manually.',
      },
      {
        id: 'dev-apple',
        name: 'Apple Health',
        kind: 'app',
        status: 'disconnected',
        metrics: ['heartRate', 'steps', 'oxygen', 'bloodPressure'],
        lastSync: null,
        note: APPLE_HEALTH_NOTE,
      },
      {
        id: 'dev-health-connect',
        name: 'Health Connect / smartwatch',
        kind: 'app',
        status: 'not-implemented',
        metrics: ['heartRate', 'steps', 'oxygen', 'bloodPressure'],
        lastSync: null,
        note: 'Requires an Android companion app. Not implemented.',
      },
    ],
    milestones: [
      { id: 'm-discharge', title: 'Home from the hospital', description: 'Discharged with your recovery plan.', category: 'clinical', targetDay: 6, completedAt: at(now, -15, 14) },
      { id: 'm-shower', title: 'Shower on your own', description: 'Gentle, warm showers with incision care.', category: 'clinical', targetDay: 10, completedAt: at(now, -11, 10) },
      { id: 'm-wound', title: 'Incision check visit', description: 'Nurse wound check — healing well.', category: 'clinical', targetDay: 14, completedAt: at(now, -7, 11) },
      { id: 'm-walk', title: 'Walk 10 minutes, twice a day', description: 'Week 3–4 walking plan.', category: 'clinical', targetDay: 21, completedAt: at(now, -1, 18) },
      { id: 'm-rehab', title: 'Start cardiac rehab', description: 'Supervised exercise sessions, 3× a week.', category: 'clinical', targetDay: 24, completedAt: null },
      { id: 'm-drive', title: 'Cleared to drive', description: 'Typically 4–6 weeks after surgery — your surgeon decides.', category: 'clinical', targetDay: 35, completedAt: null },
      { id: 'm-lift', title: 'Lift more than 10 lb', description: 'Sternal precautions lift after your surgeon clears you.', category: 'clinical', targetDay: 56, completedAt: null },
      { id: 'm-rehab-grad', title: 'Graduate cardiac rehab', description: 'Celebrate 36 sessions completed.', category: 'clinical', targetDay: 84, completedAt: null },
    ],
    appointments: [
      { id: 'ap-wound', title: 'Incision check', withId: 'ct-lee', at: at(now, -7, 11), location: 'Riverbend Heart Institute, Suite 210', notes: 'Healing well.', attended: true },
      { id: 'ap-rehab', title: 'Cardiac rehab orientation', withId: 'ct-cho', at: at(now, 2, 10), location: 'Riverbend Cardiac Rehab, 2nd floor', notes: 'Wear comfortable shoes. Bring your medication list.', attended: false },
      { id: 'ap-cardio', title: 'Cardiology follow-up', withId: 'ct-bell', at: at(now, 9, 14, 30), location: 'Riverbend Cardiology, Room 4B', notes: 'Medication review and blood pressure check.', attended: false },
      { id: 'ap-surgeon', title: 'Surgeon 6-week visit', withId: 'ct-raman', at: at(now, 21, 9), location: 'Riverbend Heart Institute, Suite 210', notes: 'Driving and lifting clearance discussion.', attended: false },
    ],
    records: [
      {
        id: 'rec-discharge',
        type: 'discharge',
        title: 'Discharge instructions — CABG',
        date: at(now, -15, 13),
        source: 'Riverbend Heart Institute (demo record)',
        reviewedAt: null,
        summary: [
          'Protect your breastbone: no lifting over 10 lb, no pushing or pulling, for at least 6 weeks.',
          'Wash your incisions gently with soap and water every day. No baths, pools, or lotions on incisions.',
          'Walk several short times a day and slowly add a few minutes, following your walking plan.',
          'Weigh yourself every morning. Call if you gain more than 2 lb in a day or 5 lb in a week.',
          'Do not drive until your surgeon clears you (usually 4–6 weeks).',
          'Call 911 for chest pain, severe shortness of breath, or fainting.',
        ],
        original:
          'POST-OPERATIVE INSTRUCTIONS FOLLOWING CORONARY ARTERY BYPASS GRAFTING. Sternal precautions: Avoid lifting >10 lbs, pushing, pulling for 6-8 weeks. Splint chest with pillow when coughing. Incision care: Cleanse daily with mild soap and water, pat dry. Do not apply creams, lotions, powders. No tub baths or swimming until cleared. Activity: Ambulate 3-5x daily, progressive per walking protocol. Avoid prolonged sitting; elevate legs when seated. Daily weights each AM prior to breakfast; notify for gain >2 lbs/24h or >5 lbs/week. No driving x 4-6 weeks or as directed. Notify provider: T > 101°F, incision erythema, drainage, or dehiscence, new/worsening dyspnea, palpitations, LE edema. Call 911: chest pain, syncope, severe SOB, signs of stroke.',
      },
      {
        id: 'rec-wound-visit',
        type: 'visit',
        title: 'Visit summary — Incision check',
        date: at(now, -7, 11),
        source: 'Jordan Lee, RN (demo record)',
        reviewedAt: at(now, -7, 15),
        summary: [
          'Chest and leg incisions are healing well with no signs of infection.',
          'Mild ankle swelling is common — keep elevating your legs.',
          'Continue current medications and walking plan.',
        ],
        original:
          'Sternal incision well-approximated, no erythema or drainage. Left saphenous vein harvest site healing, mild ecchymosis resolving. Trace bilateral LE edema. Afebrile. Continue current regimen. RTC as scheduled.',
      },
      {
        id: 'rec-labs',
        type: 'lab',
        title: 'Lab results — Basic panel & blood count',
        date: at(now, -7, 9),
        source: 'Labcorp (demo record)',
        reviewedAt: null,
        summary: [
          'Your kidney function and potassium were in the expected range.',
          'Your hemoglobin was slightly low, which is common after heart surgery. Your care team will recheck it.',
          'Ask your care team what these results mean for you.',
        ],
        original:
          'BMP: Na 139, K 4.1, Cl 102, CO2 25, BUN 18, Cr 0.9, Glu 104. CBC: WBC 7.8, Hgb 10.9 (L), Hct 33.1 (L), Plt 268.',
      },
      {
        id: 'rec-plan',
        type: 'plan',
        title: 'Cardiac Recovery Plan · Phase 2 (Weeks 3–6)',
        date: at(now, -15, 13),
        source: 'Alana Cho, PT & Dr. Priya Raman (demo record)',
        reviewedAt: at(now, -14, 10),
        summary: [
          'Walk 10–15 minutes twice daily at a pace where you can still talk.',
          'Start supervised cardiac rehab around day 24.',
          'Rest when you feel tired — fatigue is normal and improves over weeks.',
          'Keep a daily log of symptoms, weight, and medications.',
        ],
        original:
          'Phase II: Progressive ambulation 10-15 min BID, RPE 11-13. Cardiac rehabilitation referral placed; anticipated start POD 24. Sternal precautions continue. Daily symptom/weight log.',
      },
    ],
    messages: [
      {
        id: 'msg-1',
        from: 'clinician',
        author: 'Jordan Lee, RN',
        body: 'Hi Maggie! Great to see you at your incision check. Remember: rehab orientation is coming up. Reply here with any non-urgent questions.',
        at: at(now, -6, 16, 10),
        attachments: [],
        readByClinician: true,
      },
      {
        id: 'msg-2',
        from: 'patient',
        author: 'Maggie Alvarez',
        body: 'Thank you, Jordan! Is it normal that I get tired after my afternoon walk?',
        at: at(now, -5, 10, 2),
        attachments: [],
        readByClinician: true,
      },
      {
        id: 'msg-3',
        from: 'clinician',
        author: 'Jordan Lee, RN',
        body: 'Yes — feeling tired after activity is very common at this stage. Rest afterward, and keep walks at a talking pace. Let us know if it gets worse, or comes with chest pain or shortness of breath.',
        at: at(now, -5, 14, 45),
        attachments: [],
        readByClinician: true,
      },
    ],
    chat: [],
    caregiver: options.firstTime
      ? {
          status: 'none',
          name: '',
          email: '',
          relationship: '',
          invitedAt: null,
          permissions: { medications: true, appointments: true, milestones: true, healthUpdates: false },
        }
      : {
          // Demo caregiver, so the caregiver sign-in has something to show.
          status: 'active',
          name: 'Elena Alvarez',
          email: 'elena.alvarez@example.com',
          relationship: 'Daughter',
          invitedAt: at(now, -14, 18),
          permissions: { medications: true, appointments: true, milestones: true, healthUpdates: true },
        },
    rules: DEFAULT_RULES,
    alerts: [],
    supportRequests: [],
  }

  return state
}
