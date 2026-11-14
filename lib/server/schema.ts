import { z } from 'zod'

const text = (max: number) => z.string().trim().max(max)
const level5 = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
const time = z.string().regex(/^\d{2}:\d{2}$/)
const cloth = z.enum(['navy', 'blue', 'red', 'green', 'gold', 'purple', 'teal', 'charcoal', 'cream'])

export const characterSchema = z.object({
  name: text(24).min(1),
  skin: z.enum(['porcelain', 'peach', 'sand', 'golden', 'umber', 'deep']),
  hairStyle: z.enum(['short', 'spiky', 'long', 'bob', 'bun', 'curly', 'afro', 'braids', 'ponytail', 'buzz', 'bald']),
  hairColor: z.enum(['black', 'brown', 'auburn', 'ginger', 'blonde', 'silver', 'blue', 'pink']),
  eyeColor: z.enum(['brown', 'blue', 'green', 'hazel', 'gray']),
  outfit: z.enum(['tunic', 'hoodie', 'jacket', 'dress', 'overalls', 'robe', 'cape-suit']),
  outfitColor: cloth,
  pantsColor: cloth,
  shoes: z.enum(['boots', 'sneakers', 'slippers']),
  shoeColor: cloth,
  hat: z.enum(['none', 'cap', 'beanie', 'explorer', 'flower', 'wizard', 'crown']),
  glasses: z.enum(['none', 'round', 'square', 'sunnies']),
  accessory: z.enum(['none', 'scarf', 'backpack', 'heart-pin', 'staff', 'medal']),
})

const goal = z.object({
  title: text(80).min(1),
  category: z.enum(['personal', 'career', 'hobby']),
  targetDay: z.number().int().min(1).max(365),
})

const settings = z
  .object({
    showWelcome: z.boolean(),
    reduceMotion: z.boolean(),
    soundOn: z.boolean(),
    textSize: z.enum(['standard', 'large', 'xlarge']),
  })
  .partial()

const profilePatch = z
  .object({
    preferredName: text(40).min(1),
    fullName: text(80),
    surgeryType: text(120),
    surgeryDate: z.iso.datetime(),
    recoveryWeeks: z.number().int().min(1).max(52),
  })
  .partial()

const attachment = z.object({
  kind: z.enum(['recovery-summary', 'mood-summary', 'record', 'check-in']),
  label: text(120),
  lines: z.array(text(400)).max(20),
})

const symptom = z.enum([
  'none',
  'chest-pain',
  'shortness-of-breath',
  'incision-redness',
  'fever',
  'swelling',
  'dizziness',
  'fatigue',
  'palpitations',
  'nausea',
  'fainting',
])

export const actionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('onboarding.complete'),
    profile: profilePatch.extend({ preferredName: text(40).min(1) }),
    character: characterSchema,
  }),
  z.object({ type: z.literal('profile.update'), patch: profilePatch }),
  z.object({ type: z.literal('settings.update'), patch: settings }),
  z.object({ type: z.literal('character.save'), character: characterSchema }),
  z.object({
    type: z.literal('dose.log'),
    medId: z.string(),
    time,
    status: z.enum(['taken', 'skipped', 'snoozed']),
    snoozeMinutes: z.number().int().min(5).max(240).optional(),
  }),
  z.object({ type: z.literal('dose.undo'), logId: z.string() }),
  z.object({
    type: z.literal('med.update'),
    medId: z.string(),
    reminders: z.object({ enabled: z.boolean(), leadMinutes: z.number().int().min(0).max(120) }).partial().optional(),
    onHand: z.number().int().min(0).max(1000).optional(),
  }),
  z.object({
    type: z.literal('checkin.health'),
    data: z.object({
      symptoms: z.array(symptom).min(1).max(11),
      pain: z.number().int().min(0).max(10),
      activity: z.enum(['rested', 'light', 'assigned-walk', 'more-than-planned']),
      sleep: level5,
      energy: level5,
      notes: text(1000),
    }),
  }),
  z.object({
    type: z.literal('checkin.mood'),
    data: z.object({ mood: level5, stress: level5, energy: level5, sleep: level5, note: text(1000) }),
  }),
  z.object({ type: z.literal('journal.add'), prompt: text(200).nullable().optional(), text: text(5000).min(1) }),
  z.object({ type: z.literal('journal.delete'), id: z.string() }),
  z.object({ type: z.literal('quest.complete'), key: z.string() }),
  z.object({ type: z.literal('quest.undo'), key: z.string() }),
  z.object({ type: z.literal('record.review'), recordId: z.string() }),
  z.object({
    type: z.literal('reading.add'),
    metric: z.enum(['heartRate', 'bloodPressure', 'oxygen', 'steps']),
    value: z.number().min(0).max(100000),
    value2: z.number().min(0).max(300).optional(),
  }),
  z.object({ type: z.literal('device.toggle'), deviceId: z.string(), connect: z.boolean() }),
  z.object({ type: z.literal('device.sync'), deviceId: z.string() }),
  z.object({ type: z.literal('milestone.toggle'), id: z.string(), done: z.boolean() }),
  z.object({ type: z.literal('goal.add'), goal }),
  z.object({ type: z.literal('goal.update'), id: z.string(), patch: goal.partial() }),
  z.object({ type: z.literal('goal.remove'), id: z.string() }),
  z.object({ type: z.literal('message.send'), body: text(4000).min(1), attachments: z.array(attachment).max(5) }),
  z.object({ type: z.literal('support.request'), topic: text(80).min(1), note: text(1000) }),
  z.object({
    type: z.literal('caregiver.invite'),
    caregiver: z.object({
      name: text(80).min(1),
      email: z.email(),
      relationship: text(40),
      permissions: z.object({ medications: z.boolean(), appointments: z.boolean(), milestones: z.boolean(), healthUpdates: z.boolean() }),
    }),
  }),
  z.object({
    type: z.literal('caregiver.permissions'),
    permissions: z.object({ medications: z.boolean(), appointments: z.boolean(), milestones: z.boolean(), healthUpdates: z.boolean() }),
  }),
  z.object({ type: z.literal('caregiver.revoke') }),
  z.object({ type: z.literal('caregiver.simulateAccept') }),
  z.object({ type: z.literal('alert.ack'), id: z.string() }),
  z.object({ type: z.literal('demo.urgent') }),
  z.object({ type: z.literal('chat.clear') }),
  z.object({ type: z.literal('clinician.reply'), body: text(4000).min(1), author: text(80).min(1) }),
  z.object({ type: z.literal('clinician.markRead') }),
  z.object({ type: z.literal('clinician.adjustMilestone'), id: z.string(), targetDay: z.number().int().min(1).max(365) }),
  z.object({ type: z.literal('clinician.ackAlert'), id: z.string() }),
])

export type Action = z.infer<typeof actionSchema>
