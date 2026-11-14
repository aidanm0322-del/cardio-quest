'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ShieldAlert } from 'lucide-react'
import { useGame, usePatient } from '@/components/app/game-provider'
import { Choice, DialogueBox, GameButton, LoadingState } from '@/components/app/game-ui'
import { CharacterCustomizer } from '@/components/character/character-customizer'
import { PixelCharacter } from '@/components/character/pixel-character'
import type { CharacterAppearance, PersonalGoal } from '@/lib/types'

const STEPS = ['Create your companion', 'About your recovery', 'Choose personal goals', 'Safety first'] as const

const GOAL_IDEAS: Omit<PersonalGoal, 'id'>[] = [
  { title: 'Walk to the mailbox and back', category: 'personal', targetDay: 7 },
  { title: 'Cook a simple meal for my family', category: 'personal', targetDay: 21 },
  { title: 'Return to work part-time', category: 'career', targetDay: 42 },
  { title: 'Tend my garden for 20 minutes', category: 'hobby', targetDay: 35 },
  { title: 'Play a round of mini golf', category: 'hobby', targetDay: 56 },
  { title: 'Drive myself to an appointment', category: 'personal', targetDay: 30 },
]

export function OnboardingFlow() {
  const router = useRouter()
  const { data } = usePatient()
  const { run } = useGame()
  const [step, setStep] = useState(0)
  const [character, setCharacter] = useState<CharacterAppearance | null>(null)
  const [about, setAbout] = useState({ preferredName: '', surgeryType: '', surgeryDate: '', recoveryWeeks: 12 })
  const [goals, setGoals] = useState<string[]>([])
  const [ack, setAck] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!data || character) return
    setCharacter(data.character)
    setAbout({
      preferredName: data.profile.preferredName,
      surgeryType: data.profile.surgeryType,
      surgeryDate: data.profile.surgeryDate.slice(0, 10),
      recoveryWeeks: data.profile.recoveryWeeks,
    })
  }, [data, character])

  if (!data || !character) return <LoadingState label="Preparing your adventure…" />

  const canNext = step === 0 ? character.name.trim().length > 0 : step === 1 ? about.preferredName.trim().length > 0 && !!about.surgeryDate : step === 3 ? ack : true

  async function finish() {
    if (!character) return
    setSaving(true)
    const res = await run(
      {
        type: 'onboarding.complete',
        character: { ...character, name: character.name.trim() },
        profile: {
          preferredName: about.preferredName.trim(),
          surgeryType: about.surgeryType,
          surgeryDate: new Date(`${about.surgeryDate}T12:00:00`).toISOString(),
          recoveryWeeks: about.recoveryWeeks,
        },
      },
      { quiet: true },
    )
    if (res) {
      for (const title of goals) {
        const g = GOAL_IDEAS.find((x) => x.title === title)
        if (g) await run({ type: 'goal.add', goal: g }, { quiet: true })
      }
      router.push('/hub')
    }
    setSaving(false)
  }

  const dialogue = [
    `Hello, adventurer! First, let's design the companion who will travel with you. Pick a starter look or make your own.`,
    `Nice to meet you! Your care team shared your discharge plan. Please check these details look right.`,
    `Recovery is about getting back to what matters to you. Choose a few goals to place on your journey map.`,
    `One important promise before we begin.`,
  ][step]

  return (
    <main id="main" className="min-h-[calc(100dvh-2.5rem)] bg-sky/40 px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <ol className="flex items-center gap-2" aria-label="Onboarding progress">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col gap-1.5" aria-current={i === step ? 'step' : undefined}>
              <span className={`h-2.5 rounded-sm border-2 border-navy ${i <= step ? 'bg-gold' : 'bg-card'}`} />
              <span className={`hidden text-sm font-semibold sm:block ${i === step ? 'text-navy' : 'text-muted-foreground'}`}>{s}</span>
            </li>
          ))}
        </ol>

        <div className="flex items-end gap-4">
          {step > 0 && <PixelCharacter appearance={character} pose={step === 3 ? 'think' : 'talk'} size={110} className="shrink-0" />}
          <DialogueBox speaker={step > 0 ? character.name || 'Companion' : 'Guide'} tail={step > 0 ? 'left' : 'none'} className="flex-1">
            {dialogue}
          </DialogueBox>
        </div>

        <section className="pixel-frame bg-card p-5 md:p-8" aria-labelledby="step-title">
          <h1 id="step-title" className="mb-6 text-2xl font-bold text-navy md:text-3xl">
            {STEPS[step]}
          </h1>

          {step === 0 && <CharacterCustomizer value={character} onChange={setCharacter} unlocked={data.game.unlocked} />}

          {step === 1 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="What should we call you?">
                <input value={about.preferredName} maxLength={40} onChange={(e) => setAbout({ ...about, preferredName: e.target.value })} className="cq-input" />
              </Field>
              <Field label="Procedure" hint="From your discharge summary">
                <input value={about.surgeryType} maxLength={120} onChange={(e) => setAbout({ ...about, surgeryType: e.target.value })} className="cq-input" />
              </Field>
              <Field label="Surgery date">
                <input type="date" value={about.surgeryDate} onChange={(e) => setAbout({ ...about, surgeryDate: e.target.value })} className="cq-input" />
              </Field>
              <Field label="Planned recovery length (weeks)" hint="Your care team set this. Ask them before changing it.">
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={about.recoveryWeeks}
                  onChange={(e) => setAbout({ ...about, recoveryWeeks: Math.max(1, Math.min(52, Number(e.target.value) || 1)) })}
                  className="cq-input"
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground">Optional — you can add, edit, or remove goals later. Target days are suggestions, not clearance from your care team.</p>
              <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Goal ideas">
                {GOAL_IDEAS.map((g) => {
                  const on = goals.includes(g.title)
                  return (
                    <Choice key={g.title} role="checkbox" selected={on} onClick={() => setGoals(on ? goals.filter((x) => x !== g.title) : [...goals, g.title])}>
                      <span className={`flex size-6 shrink-0 items-center justify-center rounded border-2 ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                        {on && <Check className="size-4" aria-hidden />}
                      </span>
                      <span className="flex flex-col">
                        <span>{g.title}</span>
                        <span className="text-sm text-muted-foreground capitalize">
                          {g.category} · around day {g.targetDay}
                        </span>
                      </span>
                    </Choice>
                  )
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="flex gap-4 rounded-xl border-2 border-destructive bg-heart-soft p-5">
                <ShieldAlert className="size-8 shrink-0 text-destructive" aria-hidden />
                <div className="flex flex-col gap-2 text-lg">
                  <p className="font-bold">Cardio Quest is not an emergency service.</p>
                  <p>
                    If you have chest pain, severe shortness of breath, fainting, or think you may be having an emergency, <strong>call 911 right away</strong>. Don&apos;t wait for the app, a
                    message reply, or {character.name}.
                  </p>
                  <p>{character.name} can explain your care plan, but cannot diagnose you or change your treatment.</p>
                </div>
              </div>
              <label className="flex items-start gap-3 text-lg">
                <input type="checkbox" className="mt-1 size-6 accent-primary" checked={ack} onChange={(e) => setAck(e.target.checked)} />I understand. In an emergency I will call 911.
              </label>
            </div>
          )}
        </section>

        <div className="flex items-center justify-between gap-3">
          <GameButton variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft aria-hidden /> Back
          </GameButton>
          {step < STEPS.length - 1 ? (
            <GameButton onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Next <ArrowRight aria-hidden />
            </GameButton>
          ) : (
            <GameButton variant="gold" onClick={finish} disabled={!canNext || saving}>
              {saving ? 'Starting…' : 'Start my journey'} <ArrowRight aria-hidden />
            </GameButton>
          )}
        </div>
      </div>
    </main>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-semibold">{label}</span>
      {children}
      {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
    </label>
  )
}
