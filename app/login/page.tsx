import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginScreen } from '@/components/login/login-screen'

export const metadata: Metadata = { title: 'Sign in — Cardio Quest' }

export default function Page() {
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  )
}
