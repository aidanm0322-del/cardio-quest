import type { Metadata } from 'next'
import { ProfileView } from '@/components/profile/profile-view'

export const metadata: Metadata = { title: 'Profile & Settings · Cardio Quest' }

export default function Page() {
  return <ProfileView />
}
