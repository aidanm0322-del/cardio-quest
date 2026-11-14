'use client'

import { useEffect, useState } from 'react'
import { BookHeart, Check, LifeBuoy, Send, Trash2, Wind } from 'lucide-react'
import { useGame, usePatient } from '@/components/app/game-provider'
import { GameButton, PageHeader, Panel, Tag } from '@/components/app/game-ui'
import { formatDate, formatDateTime } from '@/lib/dates'
import { buildMoodSummary, lastNDays } from '@/lib/summary'
import type { Level5, MoodCheckIn } from '@/lib/types'
import { cn } from '@/lib/utils'

const PROMPTS = [
  'One small thing that went well today was…',
  'Something I am worried about right now is…',
  'When I am fully recovered, I want to…',
  'Someone who helped me this week was…',
]

type MoodDraft = Pick<MoodCheckIn, 'mood' | 'stress' | 'energy' | 'sleep' | 'note'>

export function MindView() {
  const data = usePatient().data!
  const { run } = useGame()
  const [draft, setDraft] = useState<MoodDraft>({ mood: 3, stress: 3, energy: 3, sleep: 3, note: '' })
  const [prompt, setPrompt] = useState<string | null>(null)
  const [entry, setEntry] = useState('')
  const doneToday = data.moodCheckIns.some((m) => m.day === data.today)
  const days = lastNDays(7)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mind & Mood" description="Heart recovery affects how you feel, not just your body. Feeling low or anxious after surgery is common — and worth sharing with your team." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Mood check-in" action={doneToday ? <Tag tone="green">Done today</Tag> : <Tag tone="gold">+XP quest</Tag>}>
          <form
            className="flex flex-col gap-5"
            onSubmit={async (e) => {
              e.preventDefault()
              const ok = await run({ type: 'checkin.mood', data: draft }, { success: 'Mood check-in saved' })
              if (ok) setDraft((d) => ({ ...d, note: '' }))
            }}
          >
            <Scale label="Overall mood" low="Very low" high="Great" value={draft.mood} onChange={(v) => setDraft({ ...draft, mood: v })} />
            <Scale label="Stress" low="Calm" high="Very stressed" value={draft.stress} onChange={(v) => setDraft({ ...draft, stress: v })} />
            <Scale label="Energy" low="Drained" high="Energized" value={draft.energy} onChange={(v) => setDraft({ ...draft, energy: v })} />
            <Scale label="Sleep" low="Poor" high="Restful" value={draft.sleep} onChange={(v) => setDraft({ ...draft, sleep: v })} />
            <label className="flex flex-col gap-1.5">
              <span className="font-semibold">A few words (optional)</span>
              <textarea className="cq-input" rows={2} maxLength={1000} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </label>
            <GameButton type="submit" variant="gold">
              <Check aria-hidden /> Save mood check-in
            </GameButton>
          </form>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel
            title="Your week"
            action={
              <GameButton
                variant="secondary"
                className="min-h-10 px-3"
                onClick={() => run({ type: 'message.send', body: 'Sharing my mood summary from this week.', attachments: [buildMoodSummary(data)] }, { success: 'Mood summary sent to your care team' })}
              >
                <Send aria-hidden /> Share
              </GameButton>
            }
          >
            <MoodChart checkIns={data.moodCheckIns} days={days} />
          </Panel>
          <BreathingExercise reduceMotion={data.profile.settings.reduceMotion} />
          <section className="flex gap-3 rounded-xl border-2 border-navy bg-sky p-4" aria-labelledby="crisis">
            <LifeBuoy className="size-6 shrink-0 text-navy" aria-hidden />
            <div>
              <h2 id="crisis" className="font-bold text-navy">
                Need to talk to someone now?
              </h2>
              <p>
                Call or text <a href="tel:988" className="font-bold underline">988</a> (Suicide &amp; Crisis Lifeline), any time. If you are in danger, call{' '}
                <a href="tel:911" className="font-bold underline">911</a>.
              </p>
            </div>
          </section>
        </div>
      </div>

      <Panel title="Journal" action={<BookHeart className="size-5 text-primary" aria-hidden />}>
        <p className="mb-3 text-muted-foreground">Private to you. Your journal is never shared with your care team unless you choose to.</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button key={p} type="button" aria-pressed={prompt === p} onClick={() => setPrompt(prompt === p ? null : p)} className={cn('min-h-10 rounded-full border-2 px-3 text-sm font-semibold', prompt === p ? 'border-primary bg-accent' : 'border-border hover:border-primary')}>
              {p}
            </button>
          ))}
        </div>
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!entry.trim()) return
            const ok = await run({ type: 'journal.add', prompt, text: entry.trim() }, { success: 'Journal entry saved' })
            if (ok) {
              setEntry('')
              setPrompt(null)
            }
          }}
        >
          <label htmlFor="journal" className="sr-only">
            Journal entry
          </label>
          <textarea id="journal" className="cq-input" rows={4} maxLength={5000} value={entry} onChange={(e) => setEntry(e.target.value)} placeholder={prompt ?? 'Write whatever is on your mind…'} />
          <GameButton type="submit" disabled={!entry.trim()} className="self-start">
            Save entry
          </GameButton>
        </form>
        {data.journal.length > 0 && (
          <ul className="mt-6 flex flex-col gap-3">
            {[...data.journal].reverse().map((j) => (
              <li key={j.id} className="rounded-lg border-2 border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-muted-foreground">{formatDateTime(j.at)}</p>
                  <button type="button" onClick={() => run({ type: 'journal.delete', id: j.id }, { success: 'Entry deleted' })} className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-muted" aria-label="Delete entry">
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
                {j.prompt && <p className="font-semibold">{j.prompt}</p>}
                <p className="whitespace-pre-wrap">{j.text}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

function Scale({ label, low, high, value, onChange }: { label: string; low: string; high: string; value: Level5; onChange: (v: Level5) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{label}</legend>
      <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={label}>
        {([1, 2, 3, 4, 5] as Level5[]).map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => onChange(n)} className={cn('min-h-12 rounded-lg border-2 font-pixel text-lg', value === n ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50')}>
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-sm text-muted-foreground">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </fieldset>
  )
}

function MoodChart({ checkIns, days }: { checkIns: MoodCheckIn[]; days: string[] }) {
  const byDay = days.map((d) => ({ day: d, c: [...checkIns].reverse().find((m) => m.day === d) }))
  if (!byDay.some((b) => b.c)) return <p className="text-muted-foreground">Check in a few days to see your trend.</p>
  return (
    <div>
      <div className="flex h-36 items-end gap-2" role="img" aria-label={`Mood over the last 7 days: ${byDay.map((b) => (b.c ? b.c.mood : 'none')).join(', ')}`}>
        {byDay.map(({ day, c }) => (
          <div key={day} className="flex flex-1 flex-col items-center gap-1">
            <div className={cn('w-full rounded-t-sm border-2 border-navy', c ? (c.mood >= 4 ? 'bg-success' : c.mood === 3 ? 'bg-gold' : 'bg-heart') : 'border-dashed border-border bg-transparent')} style={{ height: `${c ? c.mood * 20 : 8}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-2 text-center text-xs font-semibold text-muted-foreground">
        {byDay.map(({ day }) => (
          <span key={day} className="flex-1">
            {formatDate(`${day}T12:00:00`).split(',')[0]}
          </span>
        ))}
      </div>
    </div>
  )
}

const PHASES = ['Breathe in', 'Hold', 'Breathe out', 'Hold'] as const

function BreathingExercise({ reduceMotion }: { reduceMotion: boolean }) {
  const [running, setRunning] = useState(false)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [running])
  const phase = Math.floor(tick / 4) % 4
  const count = 4 - (tick % 4)
  const scale = phase === 0 ? 0.6 + (tick % 4) * 0.13 : phase === 1 ? 1 : phase === 2 ? 1 - (tick % 4) * 0.13 : 0.6
  return (
    <Panel title="Box breathing" action={<Wind className="size-5 text-primary" aria-hidden />}>
      <div className="flex items-center gap-5">
        <div className="flex size-28 shrink-0 items-center justify-center">
          <div className="flex size-24 items-center justify-center rounded-lg border-[3px] border-navy bg-sky font-pixel text-3xl text-navy transition-transform duration-1000 ease-linear" style={{ transform: running && !reduceMotion ? `scale(${scale})` : undefined }}>
            {running ? count : '4'}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-lg font-semibold" aria-live="polite">
            {running ? PHASES[phase] : 'In for 4, hold 4, out 4, hold 4.'}
          </p>
          <GameButton
            variant="secondary"
            onClick={() => {
              setTick(0)
              setRunning((r) => !r)
            }}
          >
            {running ? 'Stop' : 'Start'}
          </GameButton>
        </div>
      </div>
    </Panel>
  )
}
