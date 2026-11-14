'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Gift, Star, X } from 'lucide-react'
import { PixelCharacter } from '@/components/character/pixel-character'
import type { CelebrationPayload, CharacterAppearance, Cosmetic } from '@/lib/types'

const CONFETTI_COLORS = ['#F2B33D', '#E5483F', '#1E7BD8', '#FFFFFF', '#0B2D5B']

function wearing(base: CharacterAppearance, c: Cosmetic): CharacterAppearance {
  return { ...base, [c.slot]: c.value } as CharacterAppearance
}

export function CelebrationOverlay({
  payload,
  character,
  reduceMotion,
  onClose,
}: {
  payload: CelebrationPayload
  character: CharacterAppearance
  reduceMotion: boolean
  onClose: () => void
}) {
  const continueRef = useRef<HTMLButtonElement>(null)
  const leveledUp = payload.level.level > payload.levelBefore
  const pct = Math.min(100, Math.round((payload.level.xpIntoLevel / payload.level.xpForLevel) * 100))

  const confetti = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + (i % 3) * 3,
        delay: `${(i % 12) * 0.08}s`,
        dur: `${2.2 + (i % 5) * 0.3}s`,
        drift: `${((i % 7) - 3) * 18}px`,
      })),
    [],
  )

  useEffect(() => {
    continueRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/70 p-4" role="dialog" aria-modal="true" aria-labelledby="celebration-title">
      {!reduceMotion && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {confetti.map((c, i) => (
            <span
              key={i}
              className="cq-confetti absolute top-0"
              style={
                {
                  left: c.left,
                  width: c.size,
                  height: c.size,
                  background: c.color,
                  '--delay': c.delay,
                  '--dur': c.dur,
                  '--drift': c.drift,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      <div className="pixel-frame cq-pop relative flex w-full max-w-md flex-col items-center gap-4 bg-card p-6 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label="Skip celebration"
        >
          <X className="size-5" />
        </button>

        <p className="font-pixel text-sm tracking-widest text-gold-foreground uppercase">{leveledUp ? 'Level up!' : 'Nice work'}</p>
        <h2 id="celebration-title" className="font-pixel text-4xl text-navy">
          Quest Complete!
        </h2>

        <div className="flex h-44 items-end justify-center rounded-lg bg-sky px-10 pt-4">
          <PixelCharacter appearance={character} pose={reduceMotion ? 'cheer' : 'celebrate'} size={150} label={`${character.name} celebrating`} />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold text-pretty">{payload.message}</p>
          <p className="text-muted-foreground">{payload.questTitle}</p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-gold-soft px-4 py-2 font-semibold text-gold-foreground">
          <Star className="size-5 fill-gold text-gold-foreground" aria-hidden />
          <span>+{payload.xpEarned} XP</span>
        </div>

        <div className="flex w-full flex-col gap-1.5">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">
              Level {payload.level.level} · {payload.level.title}
            </span>
            <span className="text-muted-foreground">
              {payload.level.xpIntoLevel} / {payload.level.xpForLevel} XP
            </span>
          </div>
          <div
            className="h-4 w-full overflow-hidden rounded-sm border-2 border-navy bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label="Progress to next level"
          >
            <div className="h-full bg-gold transition-[width] duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">Game levels reflect participation only — not your medical recovery status.</p>
        </div>

        {payload.unlocked.length > 0 && (
          <div className="pixel-frame-gold flex w-full flex-col gap-3 bg-gold-soft p-4">
            <p className="flex items-center justify-center gap-2 font-semibold text-gold-foreground">
              <Gift className="size-5" aria-hidden /> Treasure unlocked!
            </p>
            <ul className="flex flex-wrap justify-center gap-4">
              {payload.unlocked.map((c) => (
                <li key={c.id} className="flex flex-col items-center gap-1">
                  <PixelCharacter appearance={wearing(character, c)} pose="idle" size={72} shadow={false} />
                  <span className="text-sm font-medium">{c.label}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">Equip it anytime in Customize Character.</p>
          </div>
        )}

        <button ref={continueRef} type="button" onClick={onClose} className="pixel-btn w-full rounded-lg bg-primary px-6 py-3.5 text-lg font-semibold text-primary-foreground">
          Continue My Quest
        </button>
      </div>
    </div>
  )
}
