import type { Metadata } from 'next'
import { CheckInFlow } from '@/components/check-in/check-in-flow'

export const metadata: Metadata = { title: 'Symptom Check-in · Cardio Quest' }

export default function Page() {
  return <CheckInFlow />
}
