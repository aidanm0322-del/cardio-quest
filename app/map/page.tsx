import type { Metadata } from 'next'
import { JourneyMap } from '@/components/map/journey-map'

export const metadata: Metadata = { title: 'Journey Map · Cardio Quest' }

export default function Page() {
  return <JourneyMap />
}
