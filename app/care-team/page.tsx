import type { Metadata } from 'next'
import { CareTeamView } from '@/components/care-team/care-team-view'

export const metadata: Metadata = { title: 'Care Team · Cardio Quest' }

export default function Page() {
  return <CareTeamView />
}
