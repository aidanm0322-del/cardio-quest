import type { CharacterAppearance, CharacterPose, ClothColor, EyeColor, HairColor, SkinTone } from '@/lib/types'

/**
 * Layered pixel sprite builder. Every appearance option is a layer of
 * pixel rectangles on a 20×23 grid (head x5–14, y3–11; body below), so any
 * combination works with every animation pose.
 */

export type Px = readonly [x: number, y: number, w: number, h: number, fill: string]

export const SKIN: Record<SkinTone, { base: string; shade: string; blush: string }> = {
  porcelain: { base: '#FBE3D6', shade: '#EFC5B2', blush: '#F4A9A0' },
  peach: { base: '#F6CBA6', shade: '#E3AC84', blush: '#EE9A86' },
  sand: { base: '#E4B28A', shade: '#CC946B', blush: '#DD8771' },
  golden: { base: '#C98B5E', shade: '#AD7047', blush: '#C46B55' },
  umber: { base: '#8F5A3C', shade: '#74452B', blush: '#9C4F3E' },
  deep: { base: '#5E3A27', shade: '#4A2C1C', blush: '#743A2E' },
}

export const HAIR: Record<HairColor, { base: string; shade: string }> = {
  black: { base: '#25232E', shade: '#14131A' },
  brown: { base: '#6B3F24', shade: '#4E2C17' },
  auburn: { base: '#A4442B', shade: '#7C301D' },
  ginger: { base: '#E5653A', shade: '#C24A24' },
  blonde: { base: '#F4CD6B', shade: '#D9AA45' },
  silver: { base: '#E4E6EE', shade: '#B9BDCB' },
  blue: { base: '#3E7BD8', shade: '#2A5AAA' },
  pink: { base: '#E8478F', shade: '#BE2F70' },
}

export const EYES: Record<EyeColor, string> = {
  brown: '#4A2A17',
  blue: '#2D6FD0',
  green: '#2E7D4A',
  hazel: '#8A6A2A',
  gray: '#5D6677',
}

export const CLOTH: Record<ClothColor, { base: string; shade: string }> = {
  navy: { base: '#1F3A6B', shade: '#142849' },
  blue: { base: '#1E7BD8', shade: '#155CA6' },
  red: { base: '#DD4A3F', shade: '#AF342B' },
  green: { base: '#4E9B57', shade: '#36763E' },
  gold: { base: '#EDB33F', shade: '#C38D22' },
  purple: { base: '#8457C8', shade: '#64409E' },
  teal: { base: '#2BA39B', shade: '#1F7D77' },
  charcoal: { base: '#3D3F4A', shade: '#2A2B33' },
  cream: { base: '#F2E8D2', shade: '#D8CAAA' },
}

const OUTLINE = '#1B1B2A'
const WHITE = '#FFFFFF'
const GOLD = '#F2B33D'
const GOLD_DARK = '#C98A1C'
const HEART = '#E5483F'

export interface SpriteFrames {
  /** Drawn once, behind everything (back hair, cape, staff). */
  back: Px[]
  body: Px[]
  /** Arm frames: A alternates with B for animated poses; B is empty for static poses. */
  armsA: Px[]
  armsB: Px[]
  head: Px[]
  eyesOpen: Px[]
  eyesClosed: Px[]
  mouthA: Px[]
  mouthB: Px[]
  front: Px[]
}

const r = (x: number, y: number, w: number, h: number, fill: string): Px => [x, y, w, h, fill]

function backHair(a: CharacterAppearance): Px[] {
  const h = HAIR[a.hairColor]
  switch (a.hairStyle) {
    case 'long':
      return [r(4, 4, 12, 11, h.shade), r(5, 15, 10, 1, h.shade)]
    case 'bob':
      return [r(4, 4, 12, 7, h.shade)]
    case 'braids':
      return [r(4, 4, 12, 5, h.shade)]
    case 'ponytail':
      return [r(15, 4, 2, 2, h.shade), r(16, 5, 2, 6, h.base), r(16, 11, 1, 2, h.shade), r(15, 4, 1, 1, '#E5483F')]
    case 'afro':
      return [r(3, 1, 14, 9, h.shade), r(2, 3, 16, 5, h.shade)]
    case 'curly':
      return [r(3, 3, 14, 6, h.shade)]
    default:
      return []
  }
}

function frontHair(a: CharacterAppearance): Px[] {
  const h = HAIR[a.hairColor]
  const cap = [r(5, 1, 10, 1, h.base), r(4, 2, 12, 2, h.base), r(4, 4, 1, 3, h.base), r(15, 4, 1, 3, h.base)]
  const bangs = [r(5, 4, 10, 1, h.base), r(5, 5, 2, 1, h.base), r(9, 5, 1, 1, h.shade), r(13, 5, 2, 1, h.base), r(6, 2, 3, 1, h.shade)]
  switch (a.hairStyle) {
    case 'short':
      return [...cap, ...bangs, r(4, 7, 1, 1, h.shade), r(15, 7, 1, 1, h.shade)]
    case 'spiky':
      return [
        ...cap,
        ...bangs,
        r(5, 0, 1, 1, h.base),
        r(8, -1, 2, 2, h.base),
        r(12, 0, 2, 1, h.base),
        r(9, -2, 1, 1, h.base),
        r(3, 3, 1, 2, h.base),
        r(16, 3, 1, 2, h.base),
      ]
    case 'long':
      return [...cap, ...bangs, r(4, 7, 1, 7, h.base), r(15, 7, 1, 7, h.base), r(3, 5, 1, 7, h.shade), r(16, 5, 1, 7, h.shade)]
    case 'bob':
      return [...cap, ...bangs, r(4, 7, 1, 4, h.base), r(15, 7, 1, 4, h.base), r(3, 4, 1, 6, h.shade), r(16, 4, 1, 6, h.shade)]
    case 'bun':
      return [...cap, ...bangs, r(8, -2, 4, 3, h.base), r(9, -3, 2, 1, h.base), r(8, 0, 4, 1, h.shade)]
    case 'curly':
      return [
        r(4, 1, 12, 3, h.base),
        r(3, 2, 1, 6, h.base),
        r(16, 2, 1, 6, h.base),
        r(5, 0, 2, 1, h.base),
        r(9, 0, 2, 1, h.base),
        r(13, 0, 2, 1, h.base),
        r(5, 4, 2, 1, h.base),
        r(8, 4, 1, 1, h.base),
        r(11, 4, 1, 1, h.base),
        r(13, 4, 2, 1, h.base),
        r(4, 4, 1, 4, h.shade),
        r(15, 4, 1, 4, h.shade),
        r(6, 2, 1, 1, h.shade),
        r(10, 1, 1, 1, h.shade),
        r(13, 2, 1, 1, h.shade),
      ]
    case 'afro':
      return [
        r(4, -1, 12, 5, h.base),
        r(3, 0, 14, 3, h.base),
        r(2, 2, 2, 6, h.base),
        r(16, 2, 2, 6, h.base),
        r(5, 4, 10, 1, h.base),
        r(4, 4, 1, 3, h.base),
        r(15, 4, 1, 3, h.base),
        r(6, 0, 1, 1, h.shade),
        r(10, 1, 1, 1, h.shade),
        r(13, 0, 1, 1, h.shade),
        r(3, 4, 1, 1, h.shade),
        r(16, 5, 1, 1, h.shade),
      ]
    case 'braids':
      return [
        ...cap,
        ...bangs,
        r(9, 1, 1, 3, h.shade),
        r(3, 6, 2, 2, h.base),
        r(3, 8, 2, 2, h.shade),
        r(3, 10, 2, 2, h.base),
        r(3, 12, 2, 1, '#E5483F'),
        r(3, 13, 2, 1, h.base),
        r(15, 6, 2, 2, h.base),
        r(15, 8, 2, 2, h.shade),
        r(15, 10, 2, 2, h.base),
        r(15, 12, 2, 1, '#E5483F'),
        r(15, 13, 2, 1, h.base),
      ]
    case 'ponytail':
      return [...cap, ...bangs]
    case 'buzz':
      return [r(5, 2, 10, 2, h.shade), r(4, 3, 1, 3, h.shade), r(15, 3, 1, 3, h.shade), r(6, 3, 8, 1, h.base)]
    case 'bald':
      return [r(7, 3, 2, 1, '#FFFFFF55')]
  }
}

function hat(a: CharacterAppearance): Px[] {
  switch (a.hat) {
    case 'none':
      return []
    case 'cap':
      return [r(5, 0, 10, 1, '#DD4A3F'), r(4, 1, 12, 3, '#DD4A3F'), r(9, 1, 2, 1, WHITE), r(3, 3, 9, 1, '#AF342B'), r(2, 4, 8, 1, '#AF342B')]
    case 'beanie':
      return [
        r(9, -2, 2, 2, WHITE),
        r(6, -1, 8, 1, '#1E7BD8'),
        r(5, 0, 10, 2, '#1E7BD8'),
        r(4, 2, 12, 2, '#155CA6'),
        r(6, 0, 1, 2, '#155CA6'),
        r(9, 0, 1, 2, '#155CA6'),
        r(12, 0, 1, 2, '#155CA6'),
      ]
    case 'explorer':
      return [r(6, -2, 8, 3, '#B08049'), r(6, 0, 8, 1, '#5B3A1E'), r(2, 1, 16, 2, '#8D6234'), r(2, 2, 16, 1, '#6E4824')]
    case 'flower':
      return [r(14, 2, 1, 1, '#F06AA0'), r(13, 3, 1, 1, '#F06AA0'), r(15, 3, 1, 1, '#F06AA0'), r(14, 4, 1, 1, '#F06AA0'), r(14, 3, 1, 1, GOLD)]
    case 'wizard':
      return [
        r(11, -7, 1, 1, '#4B3A8F'),
        r(10, -6, 2, 1, '#4B3A8F'),
        r(9, -5, 3, 1, '#5B47A8'),
        r(8, -4, 4, 1, '#5B47A8'),
        r(7, -3, 6, 1, '#5B47A8'),
        r(6, -2, 8, 2, '#5B47A8'),
        r(5, 0, 10, 2, '#5B47A8'),
        r(3, 2, 14, 1, '#3E2F7A'),
        r(9, -3, 1, 1, GOLD),
        r(11, -1, 1, 1, GOLD),
        r(7, 0, 1, 1, GOLD),
      ]
    case 'crown':
      return [
        r(6, -2, 1, 1, GOLD),
        r(9, -2, 2, 1, GOLD),
        r(13, -2, 1, 1, GOLD),
        r(6, -1, 8, 3, GOLD),
        r(6, 1, 8, 1, GOLD_DARK),
        r(9, 0, 2, 1, HEART),
        r(7, 0, 1, 1, '#3E7BD8'),
        r(12, 0, 1, 1, '#3E7BD8'),
      ]
  }
}

function glasses(a: CharacterAppearance): Px[] {
  switch (a.glasses) {
    case 'none':
      return []
    case 'round':
      return [r(6, 6, 3, 1, OUTLINE), r(6, 9, 3, 1, OUTLINE), r(5, 7, 1, 2, OUTLINE), r(9, 7, 1, 2, OUTLINE), r(11, 6, 3, 1, OUTLINE), r(11, 9, 3, 1, OUTLINE), r(10, 7, 1, 2, OUTLINE), r(14, 7, 1, 2, OUTLINE), r(10, 7, 1, 1, OUTLINE)]
    case 'square':
      return [r(5, 6, 5, 1, OUTLINE), r(5, 9, 5, 1, OUTLINE), r(5, 7, 1, 2, OUTLINE), r(9, 7, 1, 2, OUTLINE), r(10, 7, 1, 1, OUTLINE), r(10, 6, 5, 1, OUTLINE), r(10, 9, 5, 1, OUTLINE), r(14, 7, 1, 2, OUTLINE)]
    case 'sunnies':
      return [r(5, 6, 5, 3, '#1D2433'), r(10, 6, 5, 3, '#1D2433'), r(6, 7, 1, 1, '#6C7BA6'), r(11, 7, 1, 1, '#6C7BA6')]
  }
}

function legsAndShoes(a: CharacterAppearance): Px[] {
  const p = CLOTH[a.pantsColor]
  const s = CLOTH[a.shoeColor]
  const out: Px[] = []
  if (a.outfit !== 'dress' && a.outfit !== 'robe') {
    out.push(r(7, 18, 3, 3, p.base), r(10, 18, 3, 3, p.base), r(9, 18, 1, 3, p.shade), r(12, 18, 1, 3, p.shade))
  } else {
    out.push(r(7, 19, 2, 2, SKIN[a.skin].base), r(11, 19, 2, 2, SKIN[a.skin].base))
  }
  switch (a.shoes) {
    case 'boots':
      out.push(r(6, 20, 4, 3, s.base), r(10, 20, 4, 3, s.base), r(6, 22, 4, 1, OUTLINE), r(10, 22, 4, 1, OUTLINE))
      break
    case 'sneakers':
      out.push(r(6, 21, 4, 2, s.base), r(10, 21, 4, 2, s.base), r(6, 22, 4, 1, WHITE), r(10, 22, 4, 1, WHITE), r(7, 21, 1, 1, WHITE), r(11, 21, 1, 1, WHITE))
      break
    case 'slippers':
      out.push(r(6, 21, 4, 2, s.base), r(10, 21, 4, 2, s.base), r(7, 21, 2, 1, WHITE), r(11, 21, 2, 1, WHITE))
      break
  }
  return out
}

function torso(a: CharacterAppearance): Px[] {
  const c = CLOTH[a.outfitColor]
  const base = [r(6, 12, 8, 6, c.base), r(6, 17, 8, 1, c.shade)]
  switch (a.outfit) {
    case 'tunic':
      return [...base, r(6, 16, 8, 1, '#6B3F24'), r(9, 16, 2, 1, GOLD), r(9, 12, 2, 2, c.shade)]
    case 'hoodie':
      return [...base, r(6, 12, 8, 1, c.shade), r(8, 13, 1, 2, WHITE), r(11, 13, 1, 2, WHITE), r(8, 15, 4, 2, c.shade)]
    case 'jacket':
      return [...base, r(9, 12, 2, 6, WHITE), r(8, 12, 1, 6, c.shade), r(11, 12, 1, 6, c.shade), r(9, 13, 2, 1, '#E5483F')]
    case 'dress':
      return [r(7, 12, 6, 3, c.base), r(6, 15, 8, 2, c.base), r(5, 17, 10, 2, c.base), r(5, 18, 10, 1, c.shade), r(7, 14, 6, 1, WHITE)]
    case 'overalls':
      return [r(6, 12, 8, 6, '#F2E8D2'), r(7, 14, 6, 4, c.base), r(7, 12, 1, 2, c.base), r(12, 12, 1, 2, c.base), r(9, 15, 2, 1, c.shade), r(7, 17, 6, 1, c.shade)]
    case 'robe':
      return [r(6, 12, 8, 7, c.base), r(5, 18, 10, 2, c.base), r(5, 19, 10, 1, c.shade), r(6, 15, 8, 1, GOLD), r(9, 12, 2, 3, c.shade)]
    case 'cape-suit':
      return [...base, r(8, 13, 4, 3, WHITE), r(9, 14, 2, 1, HEART), r(8, 13, 1, 1, HEART), r(11, 13, 1, 1, HEART), r(6, 16, 8, 1, GOLD)]
  }
}

function cape(a: CharacterAppearance): Px[] {
  if (a.outfit !== 'cape-suit') return []
  return [r(4, 12, 12, 9, '#C2312A'), r(3, 16, 14, 5, '#C2312A'), r(3, 20, 14, 1, '#99241F')]
}

function accessoryBack(a: CharacterAppearance): Px[] {
  if (a.accessory === 'backpack') return [r(4, 12, 12, 5, '#8D6234'), r(4, 12, 12, 1, '#6E4824')]
  if (a.accessory === 'staff') return [r(17, 7, 1, 16, '#8D6234'), r(16, 4, 3, 3, GOLD), r(17, 5, 1, 1, WHITE)]
  return []
}

function accessoryFront(a: CharacterAppearance): Px[] {
  switch (a.accessory) {
    case 'scarf':
      return [r(6, 11, 8, 2, HEART), r(6, 12, 8, 1, '#AF342B'), r(11, 13, 2, 3, HEART), r(11, 15, 2, 1, '#AF342B')]
    case 'backpack':
      return [r(7, 12, 1, 5, '#6E4824'), r(12, 12, 1, 5, '#6E4824')]
    case 'heart-pin':
      return [r(7, 13, 1, 1, HEART), r(9, 13, 1, 1, HEART), r(7, 14, 3, 1, HEART), r(8, 15, 1, 1, HEART)]
    case 'medal':
      return [r(9, 12, 1, 3, '#1E7BD8'), r(10, 12, 1, 3, HEART), r(9, 15, 2, 2, GOLD), r(9, 16, 2, 1, GOLD_DARK)]
    default:
      return []
  }
}

function sleeve(a: CharacterAppearance) {
  if (a.outfit === 'overalls') return CLOTH.cream
  return CLOTH[a.outfitColor]
}

/** Arm layouts. Left arm is the character's right side of the screen-left. */
function arm(a: CharacterAppearance, side: 'left' | 'right', layout: 'down' | 'up' | 'wave-out' | 'chin' | 'out'): Px[] {
  const s = sleeve(a)
  const skin = SKIN[a.skin].base
  const x = side === 'left' ? 4 : 14
  const dir = side === 'left' ? -1 : 1
  // Raised arms sit one pixel further out so they never cover the face.
  const ux = side === 'left' ? 3 : 15
  switch (layout) {
    case 'down':
      return [r(x, 12, 2, 4, s.base), r(x, 12, 2, 1, s.shade), r(x, 16, 2, 1, skin)]
    case 'out':
      return [r(x, 12, 2, 3, s.base), r(x + dir * 2, 13, 2, 2, s.base), r(x + dir * 3 + (dir > 0 ? 1 : 0), 13, 1, 2, skin)]
    case 'up':
      return [r(x, 12, 2, 1, s.shade), r(ux, 9, 2, 3, s.base), r(ux, 7, 2, 2, skin)]
    case 'wave-out':
      return [r(x, 12, 2, 1, s.shade), r(ux, 10, 2, 2, s.base), r(ux + dir, 8, 2, 2, s.base), r(ux + dir * 2, 6, 2, 2, skin)]
    case 'chin':
      return [r(x, 12, 2, 3, s.base), r(x - dir * 1, 14, 2, 1, s.base), r(x - dir * 2, 11, 2, 3, s.base), r(x - dir * 2, 10, 2, 1, skin)]
  }
}

export function buildSprite(a: CharacterAppearance, pose: CharacterPose): SpriteFrames {
  const skin = SKIN[a.skin]
  const head: Px[] = [
    r(6, 3, 8, 1, skin.base),
    r(5, 4, 10, 7, skin.base),
    r(6, 11, 8, 1, skin.base),
    r(4, 7, 1, 2, skin.base),
    r(15, 7, 1, 2, skin.base),
    r(5, 10, 1, 1, skin.shade),
    r(14, 10, 1, 1, skin.shade),
    r(6, 9, 1, 1, skin.blush),
    r(13, 9, 1, 1, skin.blush),
    r(8, 12, 4, 1, skin.shade),
  ]
  const eye = EYES[a.eyeColor]
  const eyesOpen: Px[] =
    pose === 'cheer' || pose === 'celebrate'
      ? [r(7, 7, 1, 1, OUTLINE), r(8, 6, 1, 1, OUTLINE), r(9, 7, 1, 1, OUTLINE), r(11, 7, 1, 1, OUTLINE), r(12, 6, 1, 1, OUTLINE), r(13, 7, 1, 1, OUTLINE)]
      : [r(7, 7, 2, 2, eye), r(11, 7, 2, 2, eye), r(7, 7, 1, 1, WHITE), r(11, 7, 1, 1, WHITE)]
  const eyesClosed: Px[] = [r(7, 8, 2, 1, OUTLINE), r(11, 8, 2, 1, OUTLINE)]

  const smile: Px[] = [r(9, 10, 2, 1, '#8A3A2E')]
  const open: Px[] = [r(9, 10, 2, 1, '#8A3A2E'), r(9, 11, 2, 1, '#C25A4A')]
  const grin: Px[] = [r(8, 10, 4, 1, '#8A3A2E'), r(9, 11, 2, 1, '#E77B6B')]
  const hmm: Px[] = [r(10, 10, 2, 1, '#8A3A2E')]

  let armsA: Px[]
  let armsB: Px[] = []
  let mouthA = smile
  let mouthB: Px[] = []
  let extra: Px[] = []

  switch (pose) {
    case 'idle':
      armsA = [...arm(a, 'left', 'down'), ...arm(a, 'right', 'down')]
      break
    case 'wave':
      armsA = [...arm(a, 'left', 'down'), ...arm(a, 'right', 'up')]
      armsB = [...arm(a, 'left', 'down'), ...arm(a, 'right', 'wave-out')]
      mouthA = grin
      break
    case 'talk':
      armsA = [...arm(a, 'left', 'down'), ...arm(a, 'right', 'out')]
      armsB = [...arm(a, 'left', 'down'), ...arm(a, 'right', 'down')]
      mouthA = open
      mouthB = smile
      break
    case 'think':
      armsA = [...arm(a, 'left', 'down'), ...arm(a, 'right', 'chin')]
      mouthA = hmm
      extra = [r(17, 2, 1, 1, '#9AA9C7'), r(18, 0, 1, 1, '#9AA9C7'), r(19, -2, 2, 1, '#9AA9C7')]
      break
    case 'cheer':
    case 'jump':
    case 'celebrate':
      armsA = [...arm(a, 'left', 'up'), ...arm(a, 'right', 'up')]
      armsB = pose === 'jump' ? [] : [...arm(a, 'left', 'wave-out'), ...arm(a, 'right', 'wave-out')]
      mouthA = grin
      break
  }

  return {
    back: [...cape(a), ...accessoryBack(a), ...backHair(a)],
    body: [...legsAndShoes(a), ...torso(a)],
    armsA,
    armsB,
    head,
    eyesOpen,
    eyesClosed,
    mouthA,
    mouthB,
    front: [...frontHair(a), ...glasses(a), ...hat(a), ...accessoryFront(a), ...extra],
  }
}

export const SPRITE_VIEWBOX = { x: -2, y: -8, w: 24, h: 31 }
