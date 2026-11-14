import { handle } from '@/lib/server/http'
import { actionSchema } from '@/lib/server/schema'
import { applyAction, authorize, clinicianView, patientView } from '@/lib/server/service'
import { mutateState } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export function POST(req: Request) {
  return handle(async () => {
    const action = actionSchema.parse(await req.json())
    const role = await authorize(action)
    const { state, result } = await mutateState((s) => applyAction(s, action))
    return { ...result, view: role === 'clinician' ? clinicianView(state) : patientView(state) }
  })
}
