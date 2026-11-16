import { z } from 'zod'
import { checkPassword, clearSession, loginAvailable, readSession, writeSession } from '@/lib/server/auth'
import { handle } from '@/lib/server/http'
import { HttpError } from '@/lib/server/service'
import { resetState, storageKind } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export function GET() {
  return handle(async () => {
    const session = await readSession()
    return {
      role: session?.role ?? null,
      unlocked: session?.unlocked ?? [],
      logins: loginAvailable(),
      storage: storageKind,
    }
  })
}

const lockedRole = z.enum(['clinician', 'caregiver'])

const body = z.discriminatedUnion('type', [
  z.object({ type: z.literal('demo-login') }),
  z.object({ type: z.literal('login'), role: lockedRole, password: z.string().max(200) }),
  z.object({ type: z.literal('logout') }),
  z.object({ type: z.literal('switch-role'), role: z.enum(['patient', 'clinician', 'caregiver']) }),
  z.object({ type: z.literal('reset'), firstTime: z.boolean().default(false) }),
])

/** Demo login for one shared fictional patient. Replace with real per-user auth in production. */
export function POST(req: Request) {
  return handle(async () => {
    const input = body.parse(await req.json())
    const session = await readSession()

    switch (input.type) {
      case 'demo-login': {
        // Every demo visitor starts from Sunny's sample data.
        await resetState(false)
        await writeSession({ role: 'patient', unlocked: session?.unlocked ?? [] })
        return { role: 'patient' }
      }
      case 'login': {
        if (!loginAvailable()[input.role]) throw new HttpError(403, `${input.role === 'clinician' ? 'Clinician' : 'Caregiver'} sign-in isn't set up on this site.`)
        if (!checkPassword(input.role, input.password)) throw new HttpError(401, 'That password is not correct.')
        const unlocked = Array.from(new Set([...(session?.unlocked ?? []), input.role]))
        await writeSession({ role: input.role, unlocked })
        return { role: input.role }
      }
      case 'logout': {
        await clearSession()
        return { role: null }
      }
      case 'switch-role': {
        if (!session) throw new HttpError(401, 'Please sign in to continue.')
        if (input.role !== 'patient' && !session.unlocked.includes(input.role))
          throw new HttpError(403, `Sign in with the ${input.role} password to open that view.`)
        await writeSession({ ...session, role: input.role })
        return { role: input.role }
      }
      case 'reset': {
        if (!session) throw new HttpError(401, 'Please sign in to continue.')
        await resetState(input.firstTime)
        await writeSession({ ...session, role: 'patient' })
        return { role: 'patient' }
      }
    }
  })
}
