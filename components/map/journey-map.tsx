'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Check, Flag, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useGame, usePatient } from '@/components/app/game-provider'
import { GameButton, PageHeader, Panel, Tag } from '@/components/app/game-ui'
import { PixelCharacter } from '@/components/character/pixel-character'
import { dateForRecoveryDay, formatDate } from '@/lib/dates'
import type { PersonalGoal } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Stop {
  id: string
  title: string
  description: string
  category: 'clinical' | 'personal' | 'career' | 'hobby'
  targetDay: number
  done: boolean
  kind: 'milestone' | 'goal'
}

const CATEGORY_TONE = { clinical: 'blue', personal: 'gold', career: 'green', hobby: 'red' } as const

function pointAt(t: number) {
  return { x: 6 + 88 * t, y: 52 + 26 * Math.sin(t * Math.PI * 2.4) }
}

export function JourneyMap() {
  const data = usePatient().data!
  const { run } = useGame()
  const totalDays = data.profile.recoveryWeeks * 7
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<PersonalGoal | 'new' | null>(null)

  const stops = useMemo<Stop[]>(() => {
    const ms: Stop[] = data.milestones.map((m) => ({ ...m, done: !!m.completedAt, kind: 'milestone' }))
    const gs: Stop[] = data.profile.goals.map((g) => ({ ...g, description: 'Your personal goal', done: false, kind: 'goal' }))
    return [...ms, ...gs].sort((a, b) => a.targetDay - b.targetDay)
  }, [data.milestones, data.profile.goals])

  const maxDay = Math.max(totalDays, ...stops.map((s) => s.targetDay))
  const here = pointAt(Math.min(1, data.recoveryDay / maxDay))
  const path = Array.from({ length: 41 }, (_, i) => pointAt(i / 40))
  const selected = stops.find((s) => s.id === selectedId) ?? stops.find((s) => !s.done) ?? stops[0]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={`Day ${data.recoveryDay} of ${totalDays}`} title="Journey Map" description="Clinical milestones from your care team and personal goals you chose. Target days are guides — your care team may adjust them." />

      <div className="pixel-frame relative aspect-[4/3] w-full overflow-hidden bg-sky sm:aspect-[16/8]">
        <Image src="/world/map-terrain.png" alt="" fill className="pixel-render object-cover" sizes="(min-width: 1024px) 70vw, 100vw" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
          <polyline points={path.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--navy)" strokeOpacity="0.35" strokeWidth="2.6" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 12 }} />
          <polyline points={path.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--gold-soft)" strokeDasharray="2 10" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 6 }} />
        </svg>

        <ol className="absolute inset-0" aria-label="Milestones along your journey">
          {stops.map((s) => {
            const p = pointAt(Math.min(1, s.targetDay / maxDay))
            const active = selected?.id === s.id
            return (
              <li key={s.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <button
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  aria-pressed={active}
                  aria-label={`${s.title}, day ${s.targetDay}${s.done ? ', completed' : ''}`}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-md border-[3px] border-navy shadow-[0_3px_0_0_var(--navy)] sm:size-11',
                    s.done ? 'bg-success text-primary-foreground' : s.kind === 'goal' ? 'bg-gold text-navy' : 'bg-card text-navy',
                    active && 'ring-4 ring-ring ring-offset-2 ring-offset-transparent',
                  )}
                >
                  {s.done ? <Check className="size-5" aria-hidden /> : <Flag className="size-5" aria-hidden />}
                </button>
              </li>
            )
          })}
        </ol>

        <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-full" style={{ left: `${here.x}%`, top: `${here.y}%` }}>
          <PixelCharacter appearance={data.character} pose="idle" size={72} label={`${data.character.name} is here on day ${data.recoveryDay}`} />
        </div>

        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-lg bg-card/95 px-3 py-2 text-sm font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="size-3.5 rounded-sm border-2 border-navy bg-card" /> Clinical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3.5 rounded-sm border-2 border-navy bg-gold" /> Personal goal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3.5 rounded-sm border-2 border-navy bg-success" /> Done
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {selected && (
          <Panel title={selected.title} action={<Tag tone={CATEGORY_TONE[selected.category]}>{selected.category}</Tag>}>
            <p className="text-lg">{selected.description}</p>
            <p className="mt-2 text-muted-foreground">
              Target: day {selected.targetDay} ({formatDate(dateForRecoveryDay(data.profile.surgeryDate, selected.targetDay), 'long')})
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {selected.kind === 'milestone' ? (
                <GameButton
                  variant={selected.done ? 'secondary' : 'gold'}
                  onClick={() => run({ type: 'milestone.toggle', id: selected.id, done: !selected.done }, { success: selected.done ? 'Milestone reopened' : 'Milestone reached!' })}
                >
                  {selected.done ? 'Mark not reached' : 'I reached this milestone'}
                </GameButton>
              ) : (
                <>
                  <GameButton variant="secondary" onClick={() => setEditing(data.profile.goals.find((g) => g.id === selected.id) ?? null)}>
                    <Pencil aria-hidden /> Edit goal
                  </GameButton>
                  <GameButton variant="secondary" onClick={() => run({ type: 'goal.remove', id: selected.id }, { success: 'Goal removed' })}>
                    <Trash2 aria-hidden /> Remove
                  </GameButton>
                </>
              )}
            </div>
            {selected.kind === 'milestone' && selected.category === 'clinical' && !selected.done && (
              <p className="mt-4 text-sm text-muted-foreground">Check with your care team before starting activities tied to this milestone.</p>
            )}
          </Panel>
        )}

        <Panel
          title="Personal goals"
          action={
            <GameButton variant="secondary" onClick={() => setEditing('new')} className="min-h-10 px-3">
              <Plus aria-hidden /> Add
            </GameButton>
          }
        >
          {editing ? (
            <GoalForm
              initial={editing === 'new' ? null : editing}
              onCancel={() => setEditing(null)}
              onSave={async (g) => {
                const ok =
                  editing === 'new'
                    ? await run({ type: 'goal.add', goal: g }, { success: 'Goal added to your map' })
                    : await run({ type: 'goal.update', id: editing.id, patch: g }, { success: 'Goal updated' })
                if (ok) setEditing(null)
              }}
            />
          ) : data.profile.goals.length === 0 ? (
            <p className="text-muted-foreground">Add something you&apos;re looking forward to — gardening, a trip, returning to work.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.profile.goals.map((g) => (
                <li key={g.id}>
                  <button type="button" onClick={() => setSelectedId(g.id)} className="flex min-h-12 w-full items-center justify-between gap-2 rounded-lg border-2 border-border px-3 text-left hover:border-primary">
                    <span className="font-semibold">{g.title}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">Day {g.targetDay}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

function GoalForm({ initial, onSave, onCancel }: { initial: PersonalGoal | null; onSave: (g: Omit<PersonalGoal, 'id'>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [category, setCategory] = useState<PersonalGoal['category']>(initial?.category ?? 'personal')
  const [targetDay, setTargetDay] = useState(initial?.targetDay ?? 30)
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (title.trim()) onSave({ title: title.trim(), category, targetDay })
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="font-semibold">Goal</span>
        <input className="cq-input" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Walk my dog around the block" required />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Type</span>
          <select className="cq-input" value={category} onChange={(e) => setCategory(e.target.value as PersonalGoal['category'])}>
            <option value="personal">Personal</option>
            <option value="career">Career</option>
            <option value="hobby">Hobby</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Target recovery day</span>
          <input className="cq-input" type="number" min={1} max={365} value={targetDay} onChange={(e) => setTargetDay(Math.max(1, Math.min(365, Number(e.target.value) || 1)))} />
        </label>
      </div>
      <div className="flex gap-2">
        <GameButton type="submit">
          <Check aria-hidden /> Save
        </GameButton>
        <GameButton variant="secondary" onClick={onCancel}>
          <X aria-hidden /> Cancel
        </GameButton>
      </div>
    </form>
  )
}
