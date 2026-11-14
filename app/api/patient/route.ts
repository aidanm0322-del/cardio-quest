import { handle } from '@/lib/server/http'
import { patientView, requireRole } from '@/lib/server/service'
import { readState } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export function GET() {
  return handle(async () => {
    await requireRole('patient')
    return patientView(await readState())
  })
}
