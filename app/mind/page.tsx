import type { Metadata } from 'next'
import { MindView } from '@/components/mind/mind-view'

export const metadata: Metadata = { title: 'Mind & Mood · Cardio Quest' }

export default function Page() {
  return <MindView />
}
