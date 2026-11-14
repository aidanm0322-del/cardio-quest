import type { Metadata } from 'next'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

export const metadata: Metadata = { title: 'Begin your quest · Cardio Quest' }

export default function Page() {
  return <OnboardingFlow />
}
