import type { Metadata } from 'next'
import { QuestHub } from '@/components/hub/quest-hub'

export const metadata: Metadata = { title: 'Quest Hub · Cardio Quest' }

export default function Page() {
  return <QuestHub />
}
