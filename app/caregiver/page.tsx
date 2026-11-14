import type { Metadata } from 'next'
import { CaregiverView } from '@/components/caregiver/caregiver-view'

export const metadata: Metadata = { title: 'Caregiver view · Cardio Quest' }

export default function Page() {
  return <CaregiverView />
}
