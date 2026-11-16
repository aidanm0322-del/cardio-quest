import 'server-only'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import type { Role } from '@/lib/types'

/**
 * Demo login. Everyone can open the patient demo; the clinician and caregiver
 * views need a password set in the environment:
 *   CLINICIAN_PASSWORD, CAREGIVER_PASSWORD   (optional: AUTH_SECRET)
 * A role whose password is not set cannot be signed into.
 *
 * The session is a signed cookie. The signing key comes from AUTH_SECRET, or
 * else from the configured passwords, so changing a password signs everyone
 * out. This protects a single shared demo patient; it is not a substitute for
 * real per-user accounts.
 */

export const SESSION_COOKIE = 'cq_session'
const SESSION_DAYS = 7

export type LockedRole = Exclude<Role, 'patient'>
export const LOCKED_ROLES: LockedRole[] = ['clinician', 'caregiver']

export interface Session {
  /** The view the visitor is currently using. */
  role: Role
  /** Password-protected roles this visitor has signed in to. */
  unlocked: LockedRole[]
}

function passwordFor(role: LockedRole): string | undefined {
  const value = role === 'clinician' ? process.env.CLINICIAN_PASSWORD : process.env.CAREGIVER_PASSWORD
  return value?.trim() || undefined
}

export function loginAvailable(): Record<LockedRole, boolean> {
  return { clinician: !!passwordFor('clinician'), caregiver: !!passwordFor('caregiver') }
}

function signingKey() {
  const material = process.env.AUTH_SECRET || LOCKED_ROLES.map((r) => passwordFor(r) ?? '').join('\0')
  return createHash('sha256').update(`cardio-quest-session-v1\0${material}`).digest()
}

const sign = (payload: string) => createHmac('sha256', signingKey()).update(payload).digest('base64url')

function sameBytes(a: Buffer, b: Buffer) {
  return a.length === b.length && timingSafeEqual(a, b)
}

export function checkPassword(role: LockedRole, attempt: string) {
  const expected = passwordFor(role)
  if (!expected) return false
  const digest = (s: string) => createHash('sha256').update(s).digest()
  return sameBytes(digest(attempt), digest(expected))
}

export async function readSession(): Promise<Session | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value
  if (!raw) return null
  const [payload, sig] = raw.split('.')
  if (!payload || !sig || !sameBytes(Buffer.from(sig), Buffer.from(sign(payload)))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { r: Role; u: LockedRole[]; exp: number }
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null
    // A role only stays unlocked while its password is still configured.
    const available = loginAvailable()
    const unlocked = LOCKED_ROLES.filter((r) => data.u?.includes(r) && available[r])
    const role: Role = data.r === 'patient' || unlocked.includes(data.r) ? data.r : 'patient'
    return { role, unlocked }
  } catch {
    return null
  }
}

export async function writeSession(session: Session) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  const payload = Buffer.from(JSON.stringify({ r: session.role, u: session.unlocked, exp })).toString('base64url')
  // sameSite 'none' + secure keeps the cookie working inside embedded previews (e.g. v0).
  ;(await cookies()).set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export async function clearSession() {
  ;(await cookies()).delete({ name: SESSION_COOKIE, path: '/', sameSite: 'none', secure: true })
}
