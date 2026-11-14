import type { Metadata } from 'next'
import { CompanionChat } from '@/components/companion/companion-chat'

export const metadata: Metadata = { title: 'Companion · Cardio Quest' }

export default function Page() {
  return <CompanionChat />
}
