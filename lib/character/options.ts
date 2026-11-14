import type {
  Accessory,
  CharacterAppearance,
  ClothColor,
  EyeColor,
  Glasses,
  HairColor,
  HairStyle,
  Hat,
  Outfit,
  Shoes,
  SkinTone,
} from '@/lib/types'
import { CLOTH, EYES, HAIR, SKIN } from './sprite'

type Opt<T extends string> = { value: T; label: string; swatch?: string }

export const SKIN_OPTIONS: Opt<SkinTone>[] = (
  [
    ['porcelain', 'Porcelain'],
    ['peach', 'Peach'],
    ['sand', 'Sand'],
    ['golden', 'Golden'],
    ['umber', 'Umber'],
    ['deep', 'Deep'],
  ] as const
).map(([value, label]) => ({ value, label, swatch: SKIN[value].base }))

export const HAIR_STYLE_OPTIONS: Opt<HairStyle>[] = [
  { value: 'short', label: 'Short' },
  { value: 'spiky', label: 'Spiky' },
  { value: 'long', label: 'Long' },
  { value: 'bob', label: 'Bob' },
  { value: 'bun', label: 'Bun' },
  { value: 'curly', label: 'Curly' },
  { value: 'afro', label: 'Afro' },
  { value: 'braids', label: 'Braids' },
  { value: 'ponytail', label: 'Ponytail' },
  { value: 'buzz', label: 'Buzz' },
  { value: 'bald', label: 'Bald' },
]

export const HAIR_COLOR_OPTIONS: Opt<HairColor>[] = (
  [
    ['black', 'Black'],
    ['brown', 'Brown'],
    ['auburn', 'Auburn'],
    ['ginger', 'Ginger'],
    ['blonde', 'Blonde'],
    ['silver', 'Silver'],
    ['blue', 'Sky Blue'],
    ['pink', 'Rose Pink'],
  ] as const
).map(([value, label]) => ({ value, label, swatch: HAIR[value].base }))

export const EYE_OPTIONS: Opt<EyeColor>[] = (
  [
    ['brown', 'Brown'],
    ['blue', 'Blue'],
    ['green', 'Green'],
    ['hazel', 'Hazel'],
    ['gray', 'Gray'],
  ] as const
).map(([value, label]) => ({ value, label, swatch: EYES[value] }))

export const OUTFIT_OPTIONS: Opt<Outfit>[] = [
  { value: 'tunic', label: 'Adventurer Tunic' },
  { value: 'hoodie', label: 'Cozy Hoodie' },
  { value: 'jacket', label: 'Trail Jacket' },
  { value: 'dress', label: 'Meadow Dress' },
  { value: 'overalls', label: 'Gardener Overalls' },
  { value: 'robe', label: 'Scholar Robe' },
  { value: 'cape-suit', label: 'Hero Cape' },
]

export const CLOTH_OPTIONS: Opt<ClothColor>[] = (
  [
    ['navy', 'Navy'],
    ['blue', 'Blue'],
    ['red', 'Red'],
    ['green', 'Green'],
    ['gold', 'Gold'],
    ['purple', 'Purple'],
    ['teal', 'Teal'],
    ['charcoal', 'Charcoal'],
    ['cream', 'Cream'],
  ] as const
).map(([value, label]) => ({ value, label, swatch: CLOTH[value].base }))

export const SHOE_OPTIONS: Opt<Shoes>[] = [
  { value: 'boots', label: 'Boots' },
  { value: 'sneakers', label: 'Sneakers' },
  { value: 'slippers', label: 'Slippers' },
]

export const HAT_OPTIONS: Opt<Hat>[] = [
  { value: 'none', label: 'No hat' },
  { value: 'cap', label: 'Cap' },
  { value: 'beanie', label: 'Beanie' },
  { value: 'flower', label: 'Meadow Flower' },
  { value: 'explorer', label: 'Explorer Hat' },
  { value: 'wizard', label: 'Wizard Hat' },
  { value: 'crown', label: 'Crown' },
]

export const GLASSES_OPTIONS: Opt<Glasses>[] = [
  { value: 'none', label: 'None' },
  { value: 'round', label: 'Round' },
  { value: 'square', label: 'Square' },
  { value: 'sunnies', label: 'Sunglasses' },
]

export const ACCESSORY_OPTIONS: Opt<Accessory>[] = [
  { value: 'none', label: 'None' },
  { value: 'scarf', label: 'Scarf' },
  { value: 'backpack', label: 'Backpack' },
  { value: 'heart-pin', label: 'Heart Pin' },
  { value: 'staff', label: 'Walking Staff' },
  { value: 'medal', label: 'Medal' },
]

/** Starter looks — all use cosmetics available at level 1. */
export const PRESETS: { id: string; label: string; appearance: Omit<CharacterAppearance, 'name'> }[] = [
  {
    id: 'ember',
    label: 'Ember Scout',
    appearance: { skin: 'peach', hairStyle: 'spiky', hairColor: 'ginger', eyeColor: 'hazel', outfit: 'jacket', outfitColor: 'red', pantsColor: 'charcoal', shoes: 'boots', shoeColor: 'charcoal', hat: 'none', glasses: 'none', accessory: 'scarf' },
  },
  {
    id: 'scholar',
    label: 'Snow Scholar',
    appearance: { skin: 'porcelain', hairStyle: 'long', hairColor: 'silver', eyeColor: 'gray', outfit: 'robe', outfitColor: 'purple', pantsColor: 'charcoal', shoes: 'slippers', shoeColor: 'cream', hat: 'none', glasses: 'round', accessory: 'none' },
  },
  {
    id: 'gardener',
    label: 'Garden Keeper',
    appearance: { skin: 'umber', hairStyle: 'afro', hairColor: 'black', eyeColor: 'brown', outfit: 'overalls', outfitColor: 'green', pantsColor: 'green', shoes: 'boots', shoeColor: 'charcoal', hat: 'none', glasses: 'none', accessory: 'backpack' },
  },
  {
    id: 'trail',
    label: 'Trail Walker',
    appearance: { skin: 'golden', hairStyle: 'ponytail', hairColor: 'brown', eyeColor: 'brown', outfit: 'hoodie', outfitColor: 'teal', pantsColor: 'navy', shoes: 'sneakers', shoeColor: 'cream', hat: 'cap', glasses: 'none', accessory: 'staff' },
  },
  {
    id: 'sunny',
    label: 'Sunny Bard',
    appearance: { skin: 'sand', hairStyle: 'curly', hairColor: 'blonde', eyeColor: 'blue', outfit: 'tunic', outfitColor: 'gold', pantsColor: 'navy', shoes: 'boots', shoeColor: 'charcoal', hat: 'beanie', glasses: 'none', accessory: 'none' },
  },
  {
    id: 'rose',
    label: 'Rose Knight',
    appearance: { skin: 'deep', hairStyle: 'braids', hairColor: 'pink', eyeColor: 'hazel', outfit: 'dress', outfitColor: 'blue', pantsColor: 'navy', shoes: 'sneakers', shoeColor: 'red', hat: 'none', glasses: 'square', accessory: 'none' },
  },
]

export const COMPANION_NAMES = ['Pip', 'Juniper', 'Rowan', 'Sol', 'Maple', 'Echo', 'Wren', 'Biscuit']
