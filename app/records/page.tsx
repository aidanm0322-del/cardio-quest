import type { Metadata } from 'next'
import { RecordsView } from '@/components/records/records-view'

export const metadata: Metadata = { title: 'Records · Cardio Quest' }

export default function Page() {
  return <RecordsView />
}
