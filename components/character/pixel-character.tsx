'use client'

import { memo, useMemo } from 'react'
import { SPRITE_VIEWBOX, buildSprite, type Px } from '@/lib/character/sprite'
import type { CharacterAppearance, CharacterPose } from '@/lib/types'
import { cn } from '@/lib/utils'

function Pixels({ px }: { px: Px[] }) {
  return (
    <>
      {px.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
    </>
  )
}

const FRAME_SPEED: Partial<Record<CharacterPose, string>> = {
  wave: '0.45s',
  talk: '0.3s',
  cheer: '0.5s',
  celebrate: '0.35s',
}

const SPARKLES: [number, number, string, string][] = [
  [-1, 2, '#F2B33D', '0s'],
  [19, 0, '#E5483F', '0.3s'],
  [0, 14, '#1E7BD8', '0.6s'],
  [20, 12, '#F2B33D', '0.9s'],
  [10, -6, '#F2B33D', '0.45s'],
]

interface Props {
  appearance: CharacterAppearance
  pose?: CharacterPose
  /** Rendered height in px. Width follows the sprite's aspect ratio. */
  size?: number
  className?: string
  /** When omitted the sprite is decorative and hidden from screen readers. */
  label?: string
  shadow?: boolean
}

export const PixelCharacter = memo(function PixelCharacter({ appearance, pose = 'idle', size = 160, className, label, shadow = true }: Props) {
  const s = useMemo(() => buildSprite(appearance, pose), [appearance, pose])
  const { x, y, w, h } = SPRITE_VIEWBOX
  const animated = s.armsB.length > 0
  const talking = s.mouthB.length > 0
  const motion = pose === 'jump' || pose === 'celebrate' ? 'cq-jump' : 'cq-bob'

  return (
    <svg
      viewBox={`${x} ${y} ${w} ${h}`}
      width={(size * w) / h}
      height={size}
      className={cn('pixel-render overflow-visible', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ ['--cq-frame' as string]: FRAME_SPEED[pose] ?? '0.5s' }}
    >
      {shadow && <rect x={5} y={22.4} width={10} height={1} fill="#0B1F45" opacity={0.18} />}
      <g className={motion}>
        <Pixels px={s.back} />
        <Pixels px={s.body} />
        <Pixels px={s.head} />
        <g className="cq-eyes">
          <Pixels px={s.eyesOpen} />
        </g>
        <g className="cq-blink" opacity={0}>
          <Pixels px={s.eyesClosed} />
        </g>
        <g className={talking ? 'cq-frame-a' : undefined}>
          <Pixels px={s.mouthA} />
        </g>
        {talking && (
          <g className="cq-frame-b" opacity={0}>
            <Pixels px={s.mouthB} />
          </g>
        )}
        <Pixels px={s.front} />
        <g className={animated ? 'cq-frame-a' : undefined}>
          <Pixels px={s.armsA} />
        </g>
        {animated && (
          <g className="cq-frame-b" opacity={0}>
            <Pixels px={s.armsB} />
          </g>
        )}
      </g>
      {pose === 'think' &&
        [0, 1, 2].map((i) => (
          <rect key={i} className="cq-dot" x={17 + i * 1.6} y={-4 - i} width={1} height={1} fill="#0B2D5B" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      {pose === 'celebrate' &&
        SPARKLES.map(([sx, sy, fill, delay], i) => (
          <g key={i} className="cq-sparkle" style={{ animationDelay: delay }}>
            <rect x={sx} y={sy - 1} width={1} height={3} fill={fill} />
            <rect x={sx - 1} y={sy} width={3} height={1} fill={fill} />
          </g>
        ))}
    </svg>
  )
})
