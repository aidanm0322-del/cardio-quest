/**
 * Cardio Quest domain model. These types are shared by the server store,
 * the API routes, and the client. Swap `lib/server/store.ts` to connect
 * your own backend — the shapes below are the contract.
 */

export type ISODate = string
/** Calendar day in the patient's local frame, `YYYY-MM-DD`. */
export type DayKey = string

export type Role = 'patient' | 'clinician' | 'caregiver'

/* ------------------------------ Character ------------------------------ */

export type SkinTone = 'porcelain' | 'peach' | 'sand' | 'golden' | 'umber' | 'deep'
export type HairStyle =
  | 'short'
  | 'spiky'
  | 'long'
  | 'bob'
  | 'bun'
  | 'curly'
  | 'afro'
  | 'braids'
  | 'ponytail'
  | 'buzz'
  | 'bald'
export type HairColor = 'black' | 'brown' | 'auburn' | 'ginger' | 'blonde' | 'silver' | 'blue' | 'pink'
export type EyeColor = 'brown' | 'blue' | 'green' | 'hazel' | 'gray'
export type Outfit = 'tunic' | 'hoodie' | 'jacket' | 'dress' | 'overalls' | 'robe' | 'cape-suit'
export type ClothColor = 'navy' | 'blue' | 'red' | 'green' | 'gold' | 'purple' | 'teal' | 'charcoal' | 'cream'
export type Shoes = 'boots' | 'sneakers' | 'slippers'
export type Hat = 'none' | 'cap' | 'beanie' | 'explorer' | 'flower' | 'wizard' | 'crown'
export type Glasses = 'none' | 'round' | 'square' | 'sunnies'
export type Accessory = 'none' | 'scarf' | 'backpack' | 'heart-pin' | 'staff' | 'medal'

export interface CharacterAppearance {
  name: string
  skin: SkinTone
  hairStyle: HairStyle
  hairColor: HairColor
  eyeColor: EyeColor
  outfit: Outfit
  outfitColor: ClothColor
  pantsColor: ClothColor
  shoes: Shoes
  shoeColor: ClothColor
  hat: Hat
  glasses: Glasses
  accessory: Accessory
}

export type CharacterPose = 'idle' | 'wave' | 'talk' | 'think' | 'cheer' | 'jump' | 'celebrate'

export interface Cosmetic {
  id: string
  slot: 'hat' | 'accessory' | 'outfit'
  value: Hat | Accessory | Outfit
  label: string
  unlockLevel: number
}

/* ------------------------------ Profile ------------------------------ */

export interface CareTeamMember {
  id: string
  name: string
  role: string
  organization: string
  phone: string
  bio: string
  responseTime: string
}

export interface PersonalGoal {
  id: string
  title: string
  category: 'personal' | 'career' | 'hobby'
  targetDay: number
}

export interface Settings {
  showWelcome: boolean
  reduceMotion: boolean
  soundOn: boolean
  textSize: 'standard' | 'large' | 'xlarge'
}

export interface Profile {
  onboarded: boolean
  preferredName: string
  fullName: string
  dateOfBirth: string
  surgeryType: string
  surgeryDate: ISODate
  hospital: string
  recoveryWeeks: number
  planName: string
  assignedActivity: string
  goals: PersonalGoal[]
  settings: Settings
}

/* ------------------------------ Game ------------------------------ */

export type QuestKind =
  | 'medication'
  | 'symptom-check-in'
  | 'mood-check-in'
  | 'review-instructions'
  | 'appointment'
  | 'activity'

export interface Quest {
  /** Stable per day: `${kind}:${refId}:${day}`. Used to prevent duplicate rewards. */
  key: string
  kind: QuestKind
  title: string
  detail: string
  xp: number
  href: string
  /** Where in the care plan this quest comes from. */
  source: string
  done: boolean
  /** Medication quests carry the dose they refer to. */
  dose?: { medId: string; time: string }
}

export interface RewardEvent {
  id: string
  questKey: string
  title: string
  xp: number
  at: ISODate
}

export interface GameState {
  xp: number
  rewards: RewardEvent[]
  unlocked: string[]
}

export interface LevelInfo {
  level: number
  title: string
  xpIntoLevel: number
  xpForLevel: number
  nextLevelAt: number
}

export interface CelebrationPayload {
  questTitle: string
  message: string
  xpEarned: number
  levelBefore: number
  level: LevelInfo
  unlocked: Cosmetic[]
}

/* ------------------------------ Medications ------------------------------ */

export interface Medication {
  id: string
  name: string
  strength: string
  instructions: string
  purpose: string
  times: string[]
  supply: { onHand: number; perDose: number; refillAlertDays: number }
  reminders: { enabled: boolean; leadMinutes: number }
  prescriber: string
}

export type DoseStatus = 'taken' | 'skipped' | 'snoozed'

export interface DoseLog {
  id: string
  medId: string
  day: DayKey
  time: string
  status: DoseStatus
  at: ISODate
  snoozeUntil?: ISODate
}

/* ------------------------------ Check-ins ------------------------------ */

export type Symptom =
  | 'none'
  | 'chest-pain'
  | 'shortness-of-breath'
  | 'incision-redness'
  | 'fever'
  | 'swelling'
  | 'dizziness'
  | 'fatigue'
  | 'palpitations'
  | 'nausea'
  | 'fainting'

export type Level5 = 1 | 2 | 3 | 4 | 5

export interface HealthCheckIn {
  id: string
  day: DayKey
  at: ISODate
  symptoms: Symptom[]
  pain: number
  activity: 'rested' | 'light' | 'assigned-walk' | 'more-than-planned'
  sleep: Level5
  energy: Level5
  notes: string
}

export interface MoodCheckIn {
  id: string
  day: DayKey
  at: ISODate
  mood: Level5
  stress: Level5
  energy: Level5
  sleep: Level5
  note: string
}

export interface JournalEntry {
  id: string
  at: ISODate
  prompt: string | null
  text: string
}

/* ------------------------------ Health data ------------------------------ */

export type MetricType = 'heartRate' | 'bloodPressure' | 'oxygen' | 'steps'

export interface Reading {
  id: string
  metric: MetricType
  value: number
  /** Diastolic for blood pressure. */
  value2?: number
  unit: string
  at: ISODate
  source: { kind: 'device' | 'manual'; name: string }
}

export interface DeviceConnection {
  id: string
  name: string
  kind: 'watch' | 'cuff' | 'oximeter' | 'app'
  status: 'connected' | 'disconnected' | 'not-implemented'
  metrics: MetricType[]
  lastSync: ISODate | null
  note: string
  /** Last 4 characters of the active Shortcuts sync key (Apple Health only). */
  syncKeyHint?: string | null
  /** SHA-256 of the sync key. Server-only; stripped from client views. */
  syncKeyHash?: string | null
}

/* ------------------------------ Care plan ------------------------------ */

export interface Milestone {
  id: string
  title: string
  description: string
  category: 'clinical' | 'personal' | 'career' | 'hobby'
  /** Target day relative to surgery, adjustable by the care team. */
  targetDay: number
  completedAt: ISODate | null
}

export interface Appointment {
  id: string
  title: string
  withId: string
  at: ISODate
  location: string
  notes: string
  attended: boolean
}

export interface MedicalRecord {
  id: string
  type: 'discharge' | 'visit' | 'lab' | 'plan'
  title: string
  date: ISODate
  source: string
  summary: string[]
  original: string
  reviewedAt: ISODate | null
}

/* ------------------------------ Communication ------------------------------ */

export interface Attachment {
  kind: 'recovery-summary' | 'mood-summary' | 'record' | 'check-in'
  label: string
  lines: string[]
}

export interface CareMessage {
  id: string
  from: 'patient' | 'clinician'
  author: string
  body: string
  at: ISODate
  attachments: Attachment[]
  readByClinician: boolean
}

export interface ChatTurn {
  id: string
  role: 'user' | 'assistant'
  content: string
  at: ISODate
  sources: string[]
  mode?: 'ai' | 'demo' | 'urgent'
}

export interface CaregiverPermissions {
  medications: boolean
  appointments: boolean
  milestones: boolean
  healthUpdates: boolean
}

export interface Caregiver {
  status: 'none' | 'invited' | 'active' | 'revoked'
  name: string
  email: string
  relationship: string
  invitedAt: ISODate | null
  permissions: CaregiverPermissions
}

/* ------------------------------ Escalation ------------------------------ */

export type AlertSeverity = 'emergency' | 'care-team'

export interface EscalationRule {
  id: string
  label: string
  severity: AlertSeverity
  /** Human-readable rule as reviewed by the clinician. */
  condition: string
  action: string
  reviewedBy: string
}

export interface Alert {
  id: string
  at: ISODate
  ruleId: string
  severity: AlertSeverity
  trigger: string
  detail: string
  action: string
  source: 'check-in' | 'reading' | 'chat' | 'demo'
  simulated: boolean
  acknowledged: boolean
}

/* ------------------------------ Root ------------------------------ */

export interface AppState {
  version: number
  profile: Profile
  character: CharacterAppearance
  game: GameState
  careTeam: CareTeamMember[]
  medications: Medication[]
  doseLogs: DoseLog[]
  healthCheckIns: HealthCheckIn[]
  moodCheckIns: MoodCheckIn[]
  journal: JournalEntry[]
  readings: Reading[]
  devices: DeviceConnection[]
  milestones: Milestone[]
  appointments: Appointment[]
  records: MedicalRecord[]
  messages: CareMessage[]
  chat: ChatTurn[]
  caregiver: Caregiver
  rules: EscalationRule[]
  alerts: Alert[]
  supportRequests: { id: string; at: ISODate; topic: string; note: string }[]
}

/** What the patient client receives: the state plus derived values. */
export interface PatientView extends AppState {
  today: DayKey
  recoveryDay: number
  quests: Quest[]
  level: LevelInfo
}

/** Clinician sees clinical data only — no journal, companion chat, or game state. */
export interface ClinicianView {
  patient: Pick<Profile, 'fullName' | 'preferredName' | 'dateOfBirth' | 'surgeryType' | 'surgeryDate' | 'hospital' | 'planName'>
  recoveryDay: number
  healthCheckIns: HealthCheckIn[]
  doseLogs: DoseLog[]
  medications: Medication[]
  readings: Reading[]
  alerts: Alert[]
  messages: CareMessage[]
  appointments: Appointment[]
  milestones: Milestone[]
  rules: EscalationRule[]
  supportRequests: AppState['supportRequests']
  adherence7d: { scheduled: number; taken: number; pct: number }
}

export interface CaregiverView {
  status: Caregiver['status']
  caregiverName: string
  patientName: string
  recoveryDay: number
  permissions: CaregiverPermissions
  medications?: { name: string; time: string; status: 'taken' | 'skipped' | 'snoozed' | 'pending' }[]
  adherence7d?: { scheduled: number; taken: number; pct: number }
  appointments?: Pick<Appointment, 'id' | 'title' | 'at' | 'location'>[]
  milestones?: (Pick<Milestone, 'id' | 'title' | 'targetDay' | 'completedAt'>)[]
  healthUpdates?: { label: string; value: string; at: ISODate }[]
}

export interface ActionResult {
  view: PatientView
  celebration?: CelebrationPayload
  alert?: Alert
  /** Returned once when an Apple Health sync key is created. */
  syncKey?: string
  }
