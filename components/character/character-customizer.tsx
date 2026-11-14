'use client'

import { useState } from 'react'
import { Lock, Shuffle } from 'lucide-react'
import { COSMETICS, isLocked } from '@/lib/game'
import {
  ACCESSORY_OPTIONS,
  CLOTH_OPTIONS,
  EYE_OPTIONS,
  GLASSES_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HAIR_STYLE_OPTIONS,
  HAT_OPTIONS,
  OUTFIT_OPTIONS,
  PRESETS,
  SHOE_OPTIONS,
  SKIN_OPTIONS,
} from '@/lib/character/options'
import type { CharacterAppearance, CharacterPose } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PixelCharacter } from './pixel-character'

type Tab = 'looks' | 'body' | 'hair' | 'outfit' | 'extras'
const TABS: { id: Tab; label: string }[] = [
  { id: 'looks', label: 'Starter looks' },
  { id: 'body', label: 'Face & skin' },
  { id: 'hair', label: 'Hair' },
  { id: 'outfit', label: 'Outfit' },
  { id: 'extras', label: 'Hats & extras' },
]

const POSES: { pose: CharacterPose; label: string }[] = [
  { pose: 'idle', label: 'Idle' },
  { pose: 'wave', label: 'Wave' },
  { pose: 'cheer', label: 'Cheer' },
  { pose: 'jump', label: 'Jump' },
  { pose: 'think', label: 'Think' },
]

function pick<T>(list: readonly T[]) {
  return list[Math.floor(Math.random() * list.length)]
}

export function CharacterCustomizer({
  value,
  onChange,
  unlocked,
  showName = true,
}: {
  value: CharacterAppearance
  onChange: (next: CharacterAppearance) => void
  unlocked: string[]
  showName?: boolean
}) {
  const [tab, setTab] = useState<Tab>('looks')
  const [pose, setPose] = useState<CharacterPose>('wave')
  const set = <K extends keyof CharacterAppearance>(key: K, v: CharacterAppearance[K]) => onChange({ ...value, [key]: v })
  const free = <T extends { value: string }>(slot: 'hat' | 'accessory' | 'outfit', list: T[]) => list.filter((o) => !isLocked(slot, o.value, unlocked))

  function randomize() {
    onChange({
      ...value,
      skin: pick(SKIN_OPTIONS).value,
      hairStyle: pick(HAIR_STYLE_OPTIONS).value,
      hairColor: pick(HAIR_COLOR_OPTIONS).value,
      eyeColor: pick(EYE_OPTIONS).value,
      outfit: pick(free('outfit', OUTFIT_OPTIONS)).value,
      outfitColor: pick(CLOTH_OPTIONS).value,
      pantsColor: pick(CLOTH_OPTIONS).value,
      shoes: pick(SHOE_OPTIONS).value,
      shoeColor: pick(CLOTH_OPTIONS).value,
      hat: pick(free('hat', HAT_OPTIONS)).value,
      glasses: pick(GLASSES_OPTIONS).value,
      accessory: pick(free('accessory', ACCESSORY_OPTIONS)).value,
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,18rem)_1fr]">
      <div className="flex flex-col items-center gap-4 md:sticky md:top-24 md:self-start">
        <div className="flex h-64 w-full items-end justify-center rounded-xl border-4 border-navy bg-sky pb-4">
          <PixelCharacter appearance={value} pose={pose} size={200} label={`Preview of ${value.name || 'your companion'}`} />
        </div>
        <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Preview animation">
          {POSES.map((p) => (
            <button
              key={p.pose}
              type="button"
              aria-pressed={pose === p.pose}
              onClick={() => setPose(p.pose)}
              className={cn('min-h-10 rounded-md border-2 px-3 text-sm font-semibold', pose === p.pose ? 'border-navy bg-navy text-navy-foreground' : 'border-border bg-card')}
            >
              {p.label}
            </button>
          ))}
        </div>
        {showName && (
          <label className="flex w-full flex-col gap-1.5">
            <span className="font-semibold">Companion name</span>
            <input
              value={value.name}
              maxLength={24}
              onChange={(e) => set('name', e.target.value)}
              className="min-h-12 rounded-lg border-2 border-input bg-card px-3 text-lg focus-visible:border-ring focus-visible:outline-none"
            />
          </label>
        )}
        <button type="button" onClick={randomize} className="pixel-btn inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold font-semibold text-navy">
          <Shuffle className="size-5" aria-hidden /> Surprise me
        </button>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Customization categories">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn('min-h-11 shrink-0 rounded-lg px-4 font-semibold whitespace-nowrap', tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent')}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="flex flex-col gap-6">
          {tab === 'looks' && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PRESETS.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onChange({ ...p.appearance, name: value.name })}
                    className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-border bg-card p-3 hover:border-primary"
                  >
                    <span className="flex h-28 w-full items-end justify-center rounded-lg bg-sky/60">
                      <PixelCharacter appearance={{ ...p.appearance, name: p.label }} pose="idle" size={96} shadow={false} />
                    </span>
                    <span className="font-semibold">{p.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {tab === 'body' && (
            <>
              <SwatchGroup label="Skin tone" options={SKIN_OPTIONS} value={value.skin} onSelect={(v) => set('skin', v)} />
              <SwatchGroup label="Eye color" options={EYE_OPTIONS} value={value.eyeColor} onSelect={(v) => set('eyeColor', v)} />
              <ChipGroup label="Glasses" options={GLASSES_OPTIONS} value={value.glasses} onSelect={(v) => set('glasses', v)} />
            </>
          )}
          {tab === 'hair' && (
            <>
              <ChipGroup label="Hairstyle" options={HAIR_STYLE_OPTIONS} value={value.hairStyle} onSelect={(v) => set('hairStyle', v)} />
              <SwatchGroup label="Hair color" options={HAIR_COLOR_OPTIONS} value={value.hairColor} onSelect={(v) => set('hairColor', v)} />
            </>
          )}
          {tab === 'outfit' && (
            <>
              <ChipGroup label="Outfit" options={OUTFIT_OPTIONS} value={value.outfit} onSelect={(v) => set('outfit', v)} lockedFor={(v) => lockLabel('outfit', v, unlocked)} />
              <SwatchGroup label="Top color" options={CLOTH_OPTIONS} value={value.outfitColor} onSelect={(v) => set('outfitColor', v)} />
              <SwatchGroup label="Pants color" options={CLOTH_OPTIONS} value={value.pantsColor} onSelect={(v) => set('pantsColor', v)} />
              <ChipGroup label="Shoes" options={SHOE_OPTIONS} value={value.shoes} onSelect={(v) => set('shoes', v)} />
              <SwatchGroup label="Shoe color" options={CLOTH_OPTIONS} value={value.shoeColor} onSelect={(v) => set('shoeColor', v)} />
            </>
          )}
          {tab === 'extras' && (
            <>
              <ChipGroup label="Hat" options={HAT_OPTIONS} value={value.hat} onSelect={(v) => set('hat', v)} lockedFor={(v) => lockLabel('hat', v, unlocked)} />
              <ChipGroup label="Accessory" options={ACCESSORY_OPTIONS} value={value.accessory} onSelect={(v) => set('accessory', v)} lockedFor={(v) => lockLabel('accessory', v, unlocked)} />
              <p className="text-sm text-muted-foreground">Locked items are earned by completing daily care quests and reaching new levels.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function lockLabel(slot: 'hat' | 'accessory' | 'outfit', v: string, unlocked: string[]) {
  if (!isLocked(slot, v, unlocked)) return null
  const c = COSMETICS.find((x) => x.slot === slot && x.value === v)
  return c ? `Unlocks at level ${c.unlockLevel}` : 'Locked'
}

function SwatchGroup<T extends string>({ label, options, value, onSelect }: { label: string; options: { value: T; label: string; swatch?: string }[]; value: T; onSelect: (v: T) => void }) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            aria-label={o.label}
            title={o.label}
            onClick={() => onSelect(o.value)}
            className={cn('size-11 rounded-lg border-[3px]', value === o.value ? 'border-navy ring-2 ring-ring ring-offset-2' : 'border-border')}
            style={{ background: o.swatch }}
          />
        ))}
      </div>
    </fieldset>
  )
}

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onSelect,
  lockedFor,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onSelect: (v: T) => void
  lockedFor?: (v: T) => string | null
}) {
  return (
    <fieldset className="flex flex-col">
      <legend className="mb-2.5 font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => {
          const lock = lockedFor?.(o.value) ?? null
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={value === o.value}
              aria-disabled={!!lock}
              disabled={!!lock}
              onClick={() => onSelect(o.value)}
              title={lock ?? undefined}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 rounded-lg border-2 px-3.5 font-medium',
                value === o.value ? 'border-primary bg-accent text-accent-foreground' : 'border-border bg-card hover:border-primary/50',
                lock && 'cursor-not-allowed border-dashed opacity-60',
              )}
            >
              {lock && <Lock className="size-4" aria-hidden />}
              {o.label}
              {lock && <span className="sr-only">({lock})</span>}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
