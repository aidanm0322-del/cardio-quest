import { cookies } from 'next/headers'
import { z } from 'zod'
import { handle } from '@/lib/server/http'
import { HttpError, ROLE_COOKIE, currentRole } from '@/lib/server/service'
import { readState, resetState, storageKind } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export function GET() {
  return handle(async () => ({ role: await currentRole(), storage: storageKind }))
}

const body = z.discriminatedUnion('type', [
  z.object({ type: z.literal('switch-role'), role: z.enum(['patient', 'clinician', 'caregiver']) }),
  z.object({ type: z.literal('reset'), firstTime: z.boolean().default(false) }),
])

/** Demo-only role switching and data reset. Replace with real auth in production. */
export function POST(req: Request) {
  return handle(async () => {
    const input = body.parse(await req.json())
    const jar = await cookies()
    if (input.type === 'reset') {
      await resetState(input.firstTime)
      jar.set(ROLE_COOKIE, 'patient', { httpOnly: true, sameSite: 'none', secure: true, path: '/' })
      return { role: 'patient' }
    }
    if (input.role === 'caregiver') {
      const s = await readState()
      if (s.caregiver.status === 'none') throw new HttpError(400, 'No caregiver has been invited yet. Invite one from Care Team first.')
    }
    jar.set(ROLE_COOKIE, input.role, { httpOnly: true, sameSite: 'none', secure: true, path: '/' })
    return { role: input.role }
  })
}
