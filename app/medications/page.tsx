import type { Metadata } from 'next'
import { MedicationsView } from '@/components/medications/medications-view'

export const metadata: Metadata = { title: 'Medications · Cardio Quest' }

export default function Page() {
  return <MedicationsView />
}
