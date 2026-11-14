import 'server-only'
import { generateText } from 'ai'
import { dayKey, formatClock, formatDateTime, recoveryDayFor } from '@/lib/dates'
import { buildQuests } from '@/lib/game'
import type { AppState, ChatTurn } from '@/lib/types'

export const COMPANION_MODEL = 'anthropic/claude-haiku-5.5'

/** Labels the model may cite. Each maps to a real item in the patient's data. */
function sourceCatalog(state: AppState) {
  return {
    'Medication list': state.medications
      .map((m) => `${m.name} ${m.strength}: ${m.instructions} Purpose: ${m.purpose} Times: ${m.times.map(formatClock).join(', ')}.`)
      .join('\n'),
    "Today's quests": buildQuests(state, dayKey())
      .map((q) => `${q.done ? '[done]' : '[open]'} ${q.title} (${q.source})`)
      .join('\n'),
    'Appointments': state.appointments
      .filter((a) => !a.attended)
      .map((a) => `${a.title} with ${state.careTeam.find((c) => c.id === a.withId)?.name}, ${formatDateTime(a.at)} at ${a.location}. ${a.notes}`)
      .join('\n'),
    'Milestones': state.milestones
      .map((m) => `${m.completedAt ? '[done]' : '[upcoming]'} ${m.title} — target day ${m.targetDay}. ${m.description}`)
      .join('\n'),
    ...Object.fromEntries(state.records.map((r) => [r.title, r.summary.join(' ')])),
    'Recent check-ins': state.healthCheckIns
      .slice(-3)
      .map((c) => `${c.day}: pain ${c.pain}/10, symptoms ${c.symptoms.join(', ')}, energy ${c.energy}/5, sleep ${c.sleep}/5. ${c.notes}`)
      .join('\n'),
  } as Record<string, string>
}

function instructions(state: AppState) {
  const name = state.character.name
  return `You are ${name}, a friendly pixel-art companion inside Cardio Quest, a heart-surgery recovery app. You are talking with ${state.profile.preferredName || 'the patient'}, on recovery day ${recoveryDayFor(state.profile.surgeryDate)} after ${state.profile.surgeryType}.

Hard rules (never break them):
- You are not a clinician. Never diagnose, never interpret symptoms as safe or unsafe, never recommend starting, stopping, changing, or adding medications or doses, and never suggest taking more than prescribed.
- For anything clinical, explain only what the patient's own records say, then tell them to ask their care team.
- If the patient describes chest pain, trouble breathing, fainting, stroke signs, or self-harm, tell them to call 911 (or 988 for self-harm) right away.
- Only use facts from the CONTEXT below. If it is not there, say you don't know and suggest messaging the care team.
- Use warm, simple language (6th-grade reading level), short paragraphs, under 130 words. Encourage without pressure or guilt.
- End with one line exactly like: "Sources: <label>; <label>" using only labels from CONTEXT that you actually used, or "Sources: none".

CONTEXT
${Object.entries(sourceCatalog(state))
  .map(([label, body]) => `## ${label}\n${body || '(none)'}`)
  .join('\n\n')}`
}

function splitSources(text: string, allowed: string[]) {
  const match = text.match(/\n?\s*Sources:\s*(.*)\s*$/i)
  if (!match) return { content: text.trim(), sources: [] }
  const sources = match[1]
    .split(';')
    .map((s) => s.trim())
    .filter((s) => allowed.includes(s))
  return { content: text.slice(0, match.index).trim(), sources }
}

export async function companionReply(state: AppState, history: ChatTurn[]): Promise<Pick<ChatTurn, 'content' | 'sources' | 'mode'>> {
  const catalog = sourceCatalog(state)
  if (process.env.CARDIO_QUEST_DEMO_AI !== '1') {
    try {
      const { text } = await generateText({
        model: COMPANION_MODEL,
        instructions: instructions(state),
        messages: history.slice(-12).map((t) => ({ role: t.role, content: t.content })),
        maxOutputTokens: 500,
        abortSignal: AbortSignal.timeout(20_000),
      })
      return { ...splitSources(text, Object.keys(catalog)), mode: 'ai' }
    } catch (err) {
      console.error('[cardio-quest] AI unavailable, using demo responses', err)
    }
  }
  return { ...demoReply(state, history.at(-1)?.content ?? ''), mode: 'demo' }
}

/** Rule-based fallback so the demo works without an AI provider. */
function demoReply(state: AppState, input: string): Pick<ChatTurn, 'content' | 'sources'> {
  const q = input.toLowerCase()
  const name = state.profile.preferredName || 'friend'
  const open = buildQuests(state, dayKey()).filter((x) => !x.done)

  if (/\b(med|pill|dose|medication|metoprolol|aspirin|atorvastatin|furosemide)\w*/.test(q)) {
    return {
      content: `Here's your medication schedule from your list:\n\n${state.medications
        .map((m) => `• ${m.name} ${m.strength} — ${m.times.map(formatClock).join(' & ')}. ${m.purpose}`)
        .join('\n')}\n\nI can't change doses or give medical advice. For questions about side effects or timing, message your care team.`,
      sources: ['Medication list'],
    }
  }
  if (/\b(discharge|instruction|record|lab|result|explain)\b/.test(q)) {
    const rec = state.records.find((r) => (q.includes('lab') ? r.type === 'lab' : r.type === 'discharge'))!
    return {
      content: `Here's a plain-language summary of "${rec.title}":\n\n${rec.summary.map((s) => `• ${s}`).join('\n')}\n\nYour care team can explain what this means for you.`,
      sources: [rec.title],
    }
  }
  if (/\b(appointment|visit|question|prepare)\w*/.test(q)) {
    const next = state.appointments.filter((a) => !a.attended).sort((a, b) => a.at.localeCompare(b.at))[0]
    return {
      content: `Your next visit is ${next ? `${next.title} on ${formatDateTime(next.at)}` : 'not scheduled yet'}. Questions you might bring:\n\n• When can I drive and lift more than 10 lb?\n• Is my tiredness after walks expected at this stage?\n• Should my walking plan change before rehab starts?\n• Are there side effects of my medications I should watch for?`,
      sources: ['Appointments', 'Milestones'],
    }
  }
  if (/\b(sad|anxious|worried|scared|stress|down|lonely|mood|overwhelm)\w*/.test(q)) {
    return {
      content: `Thank you for telling me, ${name}. Feelings like these are really common after heart surgery, and they usually ease with time. A Mind & Mood check-in or a short breathing exercise might help right now. If these feelings stick around or feel heavy, please let your care team know — they want to help.`,
      sources: [],
    }
  }
  return {
    content: open.length
      ? `You're doing great, ${name}! Next up on your path: ${open
          .slice(0, 3)
          .map((x) => x.title)
          .join('; ')}. Want me to explain your discharge instructions or help prepare questions for your next visit?`
      : `Every quest is done for today, ${name} — wonderful work! Rest well. I can explain your records or help you prepare for your next appointment anytime.`,
    sources: ["Today's quests"],
  }
}

export async function summarizeThread(state: AppState): Promise<{ summary: string; mode: 'ai' | 'demo' }> {
  const thread = state.messages
    .slice(-20)
    .map((m) => `${m.author} (${formatDateTime(m.at)}): ${m.body}`)
    .join('\n')
  if (process.env.CARDIO_QUEST_DEMO_AI !== '1') {
    try {
      const { text } = await generateText({
        model: COMPANION_MODEL,
        instructions:
          'Summarize this patient–care-team message thread in 3 short bullet points using plain language. Include any instructions the care team gave. Do not add medical advice that is not in the thread.',
        prompt: thread,
        maxOutputTokens: 300,
        abortSignal: AbortSignal.timeout(20_000),
      })
      return { summary: text.trim(), mode: 'ai' }
    } catch (err) {
      console.error('[cardio-quest] AI unavailable for summary', err)
    }
  }
  const fromTeam = state.messages.filter((m) => m.from === 'clinician').slice(-2)
  return {
    summary: [
      `• ${state.messages.length} messages with your care team.`,
      ...fromTeam.map((m) => `• ${m.author}: ${m.body.slice(0, 160)}${m.body.length > 160 ? '…' : ''}`),
    ].join('\n'),
    mode: 'demo',
  }
}
