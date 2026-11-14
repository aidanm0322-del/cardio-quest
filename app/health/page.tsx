import type { Metadata } from 'next'
import { HealthView } from '@/components/health/health-view'

export const metadata: Metadata = { title: 'Health Data · Cardio Quest' }

export default function Page() {
  return <HealthView />
}
