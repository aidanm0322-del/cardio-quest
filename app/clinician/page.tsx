import type { Metadata } from 'next'
import { ClinicianView } from '@/components/clinician/clinician-view'

export const metadata: Metadata = { title: 'Clinician dashboard · Cardio Quest' }

export default function Page() {
  return <ClinicianView />
}
