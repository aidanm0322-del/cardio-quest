'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useGame, usePatient } from '@/components/app/game-provider'
import { GameButton, PageHeader, Panel, Tag } from '@/components/app/game-ui'
import { CharacterCustomizer } from '@/components/character/character-customizer'
import { api } from '@/lib/client/api'
import type { CharacterAppearance, PersonalGoal, Settings } from '@/lib/types'
import { cn } from '@/lib/utils'

const TEXT_SIZES: { id: Settings['textSize']; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'large', label: 'Large' },
  { id: 'xlarge', label: 'Extra large' },
]

export function ProfileView() {
  const data = usePatient().data!
  const { run } = useGame()
  const [character, setCharacter] = useState<CharacterAppearance>(data.character)
  const [name, setName] = useState(data.profile.preferredName)
  const [goal, setGoal] = useState<{ title: string; category: PersonalGoal['category']; targetDay: number }>({ title: '', category: 'personal', targetDay: 30 })
  const s = data.profile.settings
  const dirty = JSON.stringify(character) !== JSON.stringify(data.character)

  const setSetting = (patch: Partial<Settings>) => run({ type: 'settings.update', patch })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profile & Settings" description="Your hero, your goals, and how the app looks and feels." />

      <Panel title="Your hero" action={dirty ? <Tag tone="gold">Unsaved</Tag> : undefined}>
        <CharacterCustomizer value={character} onChange={setCharacter} unlocked={data.game.unlocked} />
        <div className="mt-4 flex gap-3">
          <GameButton disabled={!dirty} onClick={() => run({ type: 'character.save', character }, { success: 'Hero saved' })}>
            Save hero
          </GameButton>
          {dirty && (
            <GameButton variant="secondary" onClick={() => setCharacter(data.character)}>
              Undo changes
            </GameButton>
          )}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="About you">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (name.trim()) run({ type: 'profile.update', patch: { preferredName: name.trim() } }, { success: 'Saved' })
            }}
          >
            <label className="flex flex-col gap-1.5">
              <span className="font-semibold">What should we call you?</span>
              <input className="cq-input" maxLength={40} required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-muted-foreground">Procedure</dt>
              <dd>{data.profile.surgeryType}</dd>
              <dt className="text-muted-foreground">Hospital</dt>
              <dd>{data.profile.hospital}</dd>
              <dt className="text-muted-foreground">Plan</dt>
              <dd>{data.profile.planName}</dd>
              <dt className="text-muted-foreground">Recovery day</dt>
              <dd>{data.recoveryDay}</dd>
            </dl>
            <GameButton type="submit" className="self-start">
              Save
            </GameButton>
          </form>
        </Panel>

        <Panel title="Comfort & accessibility">
          <fieldset className="mb-5">
            <legend className="mb-2 font-semibold">Text size</legend>
            <div className="flex flex-wrap gap-2">
              {TEXT_SIZES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={s.textSize === t.id}
                  onClick={() => setSetting({ textSize: t.id })}
                  className={cn('min-h-12 rounded-lg border-2 px-4 font-semibold', s.textSize === t.id ? 'border-primary bg-accent text-navy' : 'border-border')}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>
          <ul className="flex flex-col gap-2">
            <Toggle label="Reduce motion" detail="Turns off bounces and celebrations animations" on={s.reduceMotion} onToggle={() => setSetting({ reduceMotion: !s.reduceMotion })} />
            <Toggle label="Sound effects" detail="Soft chimes when you complete quests" on={s.soundOn} onToggle={() => setSetting({ soundOn: !s.soundOn })} />
            <Toggle label="Daily welcome" detail="Show a greeting from your companion each morning" on={s.showWelcome} onToggle={() => setSetting({ showWelcome: !s.showWelcome })} />
          </ul>
        </Panel>
      </div>

      <Panel title="Life goals" action={<Tag tone="blue">Shown on your map</Tag>}>
        <p className="mb-4 text-muted-foreground">What are you getting back to? These keep the journey personal.</p>
        <ul className="mb-4 flex flex-col gap-2">
          {data.profile.goals.map((g) => (
            <li key={g.id} className="flex items-center gap-3 rounded-lg border-2 border-border p-3">
              <div className="flex-1">
                <p className="font-semibold">{g.title}</p>
                <p className="text-sm text-muted-foreground">
                  {g.category} · around day {g.targetDay}
                </p>
              </div>
              <button type="button" className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted" aria-label={`Remove ${g.title}`} onClick={() => run({ type: 'goal.remove', id: g.id })}>
                <Trash2 className="size-5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="grid gap-3 md:grid-cols-[1fr_10rem_8rem_auto] md:items-end"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!goal.title.trim()) return
            const ok = await run({ type: 'goal.add', goal: { ...goal, title: goal.title.trim() } }, { success: 'Goal added' })
            if (ok) setGoal({ ...goal, title: '' })
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Goal</span>
            <input className="cq-input" maxLength={80} placeholder="e.g. Walk my daughter down the aisle" value={goal.title} onChange={(e) => setGoal({ ...goal, title: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Type</span>
            <select className="cq-input" value={goal.category} onChange={(e) => setGoal({ ...goal, category: e.target.value as PersonalGoal['category'] })}>
              <option value="personal">Personal</option>
              <option value="career">Career</option>
              <option value="hobby">Hobby</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Target day</span>
            <input className="cq-input" type="number" min={1} max={365} value={goal.targetDay} onChange={(e) => setGoal({ ...goal, targetDay: Math.max(1, Math.min(365, Number(e.target.value) || 1)) })} />
          </label>
          <GameButton type="submit" variant="secondary">
            <Plus aria-hidden /> Add
          </GameButton>
        </form>
      </Panel>

      <Panel title="Demo data">
        <p className="mb-3">Reset everything to the starting demo state, including onboarding.</p>
        <GameButton
          variant="danger"
          onClick={async () => {
            if (!window.confirm('Reset all demo data? This cannot be undone.')) return
            await api.reset(true)
            window.location.href = '/'
          }}
        >
          Reset demo
        </GameButton>
      </Panel>
    </div>
  )
}

function Toggle({ label, detail, on, onToggle }: { label: string; detail: string; on: boolean; onToggle: () => void }) {
  return (
    <li>
      <button type="button" role="switch" aria-checked={on} onClick={onToggle} className="flex min-h-14 w-full items-center gap-3 rounded-lg border-2 border-border p-3 text-left hover:bg-muted">
        <span className={cn('relative h-6 w-11 shrink-0 rounded-full border-2 border-navy transition-colors', on ? 'bg-primary' : 'bg-muted')}>
          <span className={cn('absolute top-0.5 size-4 rounded-full bg-card transition-all', on ? 'left-5' : 'left-0.5')} />
        </span>
        <span>
          <span className="block font-semibold">{label}</span>
          <span className="block text-sm text-muted-foreground">{detail}</span>
        </span>
      </button>
    </li>
  )
}
