import type { Metadata } from 'next'
import { CaregiverAccessView } from '@/components/caregiver-access/caregiver-access-view'

export const metadata: Metadata = { title: 'Caregiver Access · Cardio Quest' }

export default function Page() {
  return <CaregiverAccessView />
}
