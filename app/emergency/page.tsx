import type { Metadata } from 'next'
import { EmergencyView } from '@/components/emergency/emergency-view'

export const metadata: Metadata = { title: 'Emergency help · Cardio Quest' }

export default function Page() {
  return <EmergencyView />
}
