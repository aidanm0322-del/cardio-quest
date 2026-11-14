'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, TriangleAlert } from 'lucide-react'
import { useGame, usePatient } from '@/components/app/game-provider'
import { Choice, DialogueBox, GameButton, PageHeader, Panel, Tag } from '@/components/app/game-ui'
import { PixelCharacter } from '@/components/character/pixel-character'
import { formatDateTime } from '@/lib/dates'
import { SYMPTOM_LABELS, matchCheckIn } from '@/lib/escalation'
import type { HealthCheckIn, Level5, Symptom } from '@/lib/types'
import { cn } from '@/lib/utils'

const SYMPTOMS: Symptom[] = ['none', 'chest-pain', 'shortness-of-breath', 'fainting', 'palpitations', 'dizziness', 'incision-redness', 'fever', 'swelling', 'fatigue', 'nausea']

const ACTIVITY: { value: HealthCheckIn['activity']; label: string }[] = [
  { value: 'rested', label: 'Mostly rested' },
  { value: 'light', label: 'Light movement around the house' },
  { value: 'assigned-walk', label: 'Did my assigned walk' },
  { value: 'more-than-planned', label: 'More than my plan' },
]

const STEPS = ['Symptoms', 'Pain', 'Activity', 'Sleep & energy', 'Notes'] as const

type Draft = Omit<HealthCheckIn, 'id' | 'day' | 'at'>
const EMPTY: Draft = { symptoms: [], pain: 0, activity: 'light', sleep: 3, energy: 3, notes: '' }

export function CheckInFlow() {
  const data = usePatient().data!
  const { run } = useGame()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const doneToday = data.healthCheckIns.some((c) => c.day === data.today)
  const urgentPreview = matchCheckIn(draft, data.rules).find((m) => m.rule.severity === 'emergency')

  function toggleSymptom(s: Symptom) {
    setDraft((d) => {
      if (s === 'none') return { ...d, symptoms: d.symptoms.includes('none') ? [] : ['none'] }
      const rest = d.symptoms.filter((x) => x !== 'none')
      return { ...d, symptoms: rest.includes(s) ? rest.filter((x) => x !== s) : [...rest, s] }
    })
  }

  async function submit() {
    setSaving(true)
    const res = await run({ type: 'checkin.health', data: draft })
    setSaving(false)
    if (res) setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-6 text-center">
        <PixelCharacter appearance={data.character} pose="cheer" size={170} />
        <DialogueBox speaker={data.character.name} tail="none">
          Thank you for checking in. Your answers are saved and visible to your care team.
        </DialogueBox>
        <div className="flex flex-wrap justify-center gap-3">
          <GameButton href="/hub">Back to Quest Hub</GameButton>
          <GameButton
            variant="secondary"
            onClick={() => {
              setDraft(EMPTY)
              setStep(0)
              setSubmitted(false)
            }}
          >
            Log another check-in
          </GameButton>
        </div>
      </div>
    )
  }

  const canNext = step !== 0 || draft.symptoms.length > 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Symptom Check-in" description="A quick look at how your body is doing today. Your care team reviews these answers.">
        {doneToday && <Tag tone="green">Already checked in today</Tag>}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="pixel-frame flex flex-col gap-6 bg-card p-5 md:p-7" aria-labelledby="ci-step">
          <div className="flex items-center justify-between gap-3">
            <h2 id="ci-step" className="text-2xl font-bold text-navy">
              {STEPS[step]}
            </h2>
            <span className="font-semibold text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-sm border-2 border-navy bg-muted" aria-hidden>
            <div className="h-full bg-gold transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>

          {step === 0 && (
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-lg">Are you having any of these right now? Choose all that apply.</legend>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {SYMPTOMS.map((s) => (
                  <Choice key={s} role="checkbox" selected={draft.symptoms.includes(s)} onClick={() => toggleSymptom(s)} className={cn(s === 'none' && 'sm:col-span-2')}>
                    <span className={cn('flex size-6 shrink-0 items-center justify-center rounded border-2', draft.symptoms.includes(s) ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
                      {draft.symptoms.includes(s) && <Check className="size-4" aria-hidden />}
                    </span>
                    {SYMPTOM_LABELS[s]}
                  </Choice>
                ))}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset>
              <legend className="mb-4 text-lg">How much pain do you have right now? 0 means none, 10 is the worst you can imagine.</legend>
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-11" role="radiogroup" aria-label="Pain level">
                {Array.from({ length: 11 }, (_, n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={draft.pain === n}
                    onClick={() => setDraft({ ...draft, pain: n })}
                    className={cn(
                      'min-h-14 rounded-lg border-2 font-pixel text-xl',
                      draft.pain === n ? (n >= 7 ? 'border-destructive bg-destructive text-destructive-foreground' : 'border-primary bg-primary text-primary-foreground') : 'border-border bg-card hover:border-primary/50',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                <span>No pain</span>
                <span>Worst pain</span>
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-3 text-lg">How active were you today? Your plan: {data.profile.assignedActivity}</legend>
              {ACTIVITY.map((a) => (
                <Choice key={a.value} selected={draft.activity === a.value} onClick={() => setDraft({ ...draft, activity: a.value })}>
                  {a.label}
                </Choice>
              ))}
            </fieldset>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <Scale label="How did you sleep last night?" low="Very poorly" high="Very well" value={draft.sleep} onChange={(v) => setDraft({ ...draft, sleep: v })} />
              <Scale label="How is your energy?" low="Exhausted" high="Energized" value={draft.energy} onChange={(v) => setDraft({ ...draft, energy: v })} />
            </div>
          )}

          {step === 4 && (
            <label className="flex flex-col gap-2">
              <span className="text-lg">Anything else your care team should know? (optional)</span>
              <textarea value={draft.notes} maxLength={1000} rows={5} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="cq-input" />
            </label>
          )}

          {urgentPreview && (
            <div role="alert" className="flex gap-3 rounded-xl border-2 border-destructive bg-heart-soft p-4">
              <TriangleAlert className="size-6 shrink-0 text-destructive" aria-hidden />
              <div>
                <p className="font-bold">{urgentPreview.rule.label} can be serious.</p>
                <p>If this is happening now, call 911. You don&apos;t need to finish this check-in first.</p>
                <a href="tel:911" className="mt-2 inline-flex min-h-11 items-center rounded-lg bg-destructive px-4 font-bold text-destructive-foreground">
                  Call 911
                </a>
              </div>
            </div>
          )}

          <div className="flex justify-between gap-3">
            <GameButton variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
              <ArrowLeft aria-hidden /> Back
            </GameButton>
            {step < STEPS.length - 1 ? (
              <GameButton onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Next <ArrowRight aria-hidden />
              </GameButton>
            ) : (
              <GameButton variant="gold" onClick={submit} disabled={saving}>
                {saving ? 'Saving…' : 'Submit check-in'} <Check aria-hidden />
              </GameButton>
            )}
          </div>
        </section>

        <Panel title="Recent check-ins">
          {data.healthCheckIns.length === 0 ? (
            <p className="text-muted-foreground">No check-ins yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {[...data.healthCheckIns]
                .reverse()
                .slice(0, 6)
                .map((c) => (
                  <li key={c.id} className="rounded-lg border-2 border-border p-3">
                    <p className="text-sm font-semibold text-muted-foreground">{formatDateTime(c.at)}</p>
                    <p className="font-semibold">Pain {c.pain}/10 · Energy {c.energy}/5</p>
                    <p className="text-sm">{c.symptoms.map((s) => SYMPTOM_LABELS[s]).join(', ')}</p>
                  </li>
                ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

function Scale({ label, low, high, value, onChange }: { label: string; low: string; high: string; value: Level5; onChange: (v: Level5) => void }) {
  return (
    <fieldset>
      <legend className="mb-3 text-lg">{label}</legend>
      <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={label}>
        {([1, 2, 3, 4, 5] as Level5[]).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onChange(n)}
            className={cn('min-h-14 rounded-lg border-2 font-pixel text-xl', value === n ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/50')}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-sm text-muted-foreground">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </fieldset>
  )
}
