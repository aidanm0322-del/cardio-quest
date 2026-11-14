import type { EscalationRule, HealthCheckIn, MoodCheckIn, Reading, Symptom } from './types'

/**
 * Escalation rules are configuration, not AI. They run synchronously on the
 * client and the server so urgent guidance never waits for a model response.
 * The seeded rules are fictional demo rules "reviewed" by a demo clinician —
 * a real deployment must load rules approved by the patient's care team.
 */
export const DEFAULT_RULES: EscalationRule[] = [
  {
    id: 'chest-pain',
    label: 'Chest pain or pressure',
    severity: 'emergency',
    condition: 'Patient reports chest pain, pressure, or tightness',
    action: 'Call 911 now. Do not drive yourself. Unlock your door and sit down while you wait.',
    reviewedBy: 'Dr. Priya Raman (demo)',
  },
  {
    id: 'breathing-fainting',
    label: 'Severe breathing trouble or fainting',
    severity: 'emergency',
    condition: 'Patient reports fainting, or shortness of breath that is severe or at rest',
    action: 'Call 911 now. Stay seated or lying down and keep your phone with you.',
    reviewedBy: 'Dr. Priya Raman (demo)',
  },
  {
    id: 'stroke-signs',
    label: 'Possible stroke warning signs',
    severity: 'emergency',
    condition: 'Face drooping, arm weakness, slurred speech, sudden confusion or vision loss',
    action: 'Call 911 now and note the time symptoms started.',
    reviewedBy: 'Dr. Priya Raman (demo)',
  },
  {
    id: 'crisis',
    label: 'Thoughts of self-harm',
    severity: 'emergency',
    condition: 'Patient expresses thoughts of suicide or self-harm',
    action:
      'Call or text 988 (Suicide & Crisis Lifeline) now to talk with someone. If you are in immediate danger, call 911.',
    reviewedBy: 'Dr. Priya Raman (demo)',
  },
  {
    id: 'fever-incision',
    label: 'Fever or incision changes',
    severity: 'care-team',
    condition: 'Fever, or incision redness, warmth, or drainage',
    action: 'Call your cardiac surgery nurse line today: (555) 014-2200. Take your temperature and note it.',
    reviewedBy: 'Dr. Priya Raman (demo)',
  },
  {
    id: 'rhythm',
    label: 'Palpitations, dizziness, or new swelling',
    severity: 'care-team',
    condition: 'New palpitations, dizziness, or leg/ankle swelling',
    action: 'Contact your care team today. If it comes with chest pain or fainting, call 911.',
    reviewedBy: 'Dr. Priya Raman (demo)',
  },
  {
    id: 'pain-high',
    label: 'Pain 8 or higher',
    severity: 'care-team',
    condition: 'Pain rated 8 or higher out of 10',
    action: 'Contact your care team today to talk through your pain plan. Do not take extra medication.',
    reviewedBy: 'Dr. Priya Raman (demo)',
  },
  {
    id: 'hr-range',
    label: 'Heart rate out of range',
    severity: 'care-team',
    condition: 'Resting heart rate above 120 bpm or below 45 bpm',
    action: 'Rest for 5 minutes and recheck. If still out of range, contact your care team now.',
    reviewedBy: 'Dr. Priya Raman (demo)',
  },
  {
    id: 'bp-high',
    label: 'Very high blood pressure',
    severity: 'care-team',
    condition: 'Blood pressure 180/120 or higher',
    action:
      'Rest 5 minutes and recheck. If still 180/120 or higher, contact your care team now. Call 911 if you also have chest pain, shortness of breath, numbness, or vision changes.',
    reviewedBy: 'Dr. Priya Raman (demo)',
  },
  {
    id: 'oxygen-low',
    label: 'Low oxygen level',
    severity: 'care-team',
    condition: 'Oxygen saturation below 92%',
    action: 'Sit upright, rest, and recheck. If still below 92%, contact your care team now. If you are struggling to breathe, call 911.',
    reviewedBy: 'Dr. Priya Raman (demo)',
  },
]

export interface RuleMatch {
  rule: EscalationRule
  trigger: string
}

const TEXT_PATTERNS: { ruleId: string; pattern: RegExp; trigger: string }[] = [
  { ruleId: 'crisis', pattern: /\b(kill myself|suicid\w*|end my life|self[- ]harm|hurt myself|don'?t want to (live|be here))\b/i, trigger: 'Message mentions self-harm' },
  { ruleId: 'chest-pain', pattern: /\b(chest (pain|pressure|tight\w*|hurts?)|crushing|pain in my chest|heart attack)\b/i, trigger: 'Message mentions chest pain' },
  { ruleId: 'breathing-fainting', pattern: /\b(can'?t breathe|cannot breathe|struggling to breathe|short(ness)? of breath|faint(ed|ing)?|passed out|blacked out)\b/i, trigger: 'Message mentions breathing trouble or fainting' },
  { ruleId: 'stroke-signs', pattern: /\b(face (is )?droop\w*|slurred speech|can'?t (move|feel) my (arm|leg)|sudden (confusion|numbness)|lost (my )?vision)\b/i, trigger: 'Message mentions stroke warning signs' },
]

export function matchText(text: string, rules = DEFAULT_RULES): RuleMatch | null {
  for (const p of TEXT_PATTERNS) {
    if (p.pattern.test(text)) {
      const rule = rules.find((r) => r.id === p.ruleId)
      if (rule) return { rule, trigger: p.trigger }
    }
  }
  return null
}

const SYMPTOM_RULES: Partial<Record<Symptom, string>> = {
  'chest-pain': 'chest-pain',
  fainting: 'breathing-fainting',
  'shortness-of-breath': 'breathing-fainting',
  fever: 'fever-incision',
  'incision-redness': 'fever-incision',
  palpitations: 'rhythm',
  dizziness: 'rhythm',
  swelling: 'rhythm',
}

export const SYMPTOM_LABELS: Record<Symptom, string> = {
  none: 'No new symptoms',
  'chest-pain': 'Chest pain or pressure',
  'shortness-of-breath': 'Shortness of breath',
  'incision-redness': 'Incision redness or drainage',
  fever: 'Fever or chills',
  swelling: 'Leg or ankle swelling',
  dizziness: 'Dizziness',
  fatigue: 'More tired than usual',
  palpitations: 'Racing or fluttering heart',
  nausea: 'Nausea',
  fainting: 'Fainting or near-fainting',
}

function sortBySeverity(matches: RuleMatch[]) {
  return matches.sort((a, b) => (a.rule.severity === b.rule.severity ? 0 : a.rule.severity === 'emergency' ? -1 : 1))
}

export function matchCheckIn(c: Pick<HealthCheckIn, 'symptoms' | 'pain' | 'notes'>, rules = DEFAULT_RULES): RuleMatch[] {
  const out: RuleMatch[] = []
  const seen = new Set<string>()
  for (const s of c.symptoms) {
    const id = SYMPTOM_RULES[s]
    const rule = id && rules.find((r) => r.id === id)
    if (rule && !seen.has(rule.id)) {
      seen.add(rule.id)
      out.push({ rule, trigger: `Reported: ${SYMPTOM_LABELS[s]}` })
    }
  }
  if (c.pain >= 8) {
    const rule = rules.find((r) => r.id === 'pain-high')
    if (rule) out.push({ rule, trigger: `Pain rated ${c.pain}/10` })
  }
  const text = c.notes && matchText(c.notes, rules)
  if (text && !seen.has(text.rule.id)) out.push(text)
  return sortBySeverity(out)
}

export function matchMood(m: Pick<MoodCheckIn, 'note'>, rules = DEFAULT_RULES): RuleMatch | null {
  const t = m.note ? matchText(m.note, rules) : null
  return t && t.rule.id === 'crisis' ? t : null
}

export function matchReading(r: Pick<Reading, 'metric' | 'value' | 'value2'>, rules = DEFAULT_RULES): RuleMatch | null {
  const find = (id: string) => rules.find((x) => x.id === id)
  if (r.metric === 'heartRate' && (r.value > 120 || r.value < 45)) {
    const rule = find('hr-range')
    return rule ? { rule, trigger: `Heart rate ${r.value} bpm` } : null
  }
  if (r.metric === 'bloodPressure' && (r.value >= 180 || (r.value2 ?? 0) >= 120)) {
    const rule = find('bp-high')
    return rule ? { rule, trigger: `Blood pressure ${r.value}/${r.value2} mmHg` } : null
  }
  if (r.metric === 'oxygen' && r.value < 92) {
    const rule = find('oxygen-low')
    return rule ? { rule, trigger: `Oxygen ${r.value}%` } : null
  }
  return null
}
