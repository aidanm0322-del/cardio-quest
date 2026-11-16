import type { Action } from '@/lib/server/schema'
import type { ActionResult, Alert, CaregiverView, ClinicianView, PatientView, Role } from '@/lib/types'

/**
 * Client-side service layer. Every screen talks to the backend only through
 * these functions, so a team can point them at another API without touching UI.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, body.error ?? 'Something went wrong. Please try again.')
  return body as T
}

const post = <T,>(url: string, data: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(data) })

export type { Action }

export type LockedRole = Exclude<Role, 'patient'>

export interface SessionInfo {
  /** null when signed out. */
  role: Role | null
  /** Password-protected roles this visitor has signed in to. */
  unlocked: LockedRole[]
  /** Which password sign-ins this site has configured. */
  logins: Record<LockedRole, boolean>
  storage: 'postgres' | 'file'
}

export const KEYS = {
  patient: '/api/patient',
  clinician: '/api/clinician',
  caregiver: '/api/caregiver',
  session: '/api/session',
} as const

export const api = {
  patient: () => request<PatientView>(KEYS.patient),
  clinician: () => request<ClinicianView>(KEYS.clinician),
  caregiver: () => request<CaregiverView>(KEYS.caregiver),
  session: () => request<SessionInfo>(KEYS.session),
  demoLogin: () => post<{ role: Role }>(KEYS.session, { type: 'demo-login' }),
  login: (role: LockedRole, password: string) => post<{ role: Role }>(KEYS.session, { type: 'login', role, password }),
  logout: () => post<{ role: null }>(KEYS.session, { type: 'logout' }),
  act: (action: Action) => post<ActionResult>('/api/actions', action),
  clinicianAct: (action: Action) => post<{ view: ClinicianView }>('/api/actions', action),
  chat: (message: string) => post<{ view: PatientView; alert?: Alert }>('/api/chat', { task: 'chat', message }),
  summarizeThread: () => post<{ summary: string; mode: 'ai' | 'demo' }>('/api/chat', { task: 'summarize-thread' }),
  switchRole: (role: Role) => post<{ role: Role }>(KEYS.session, { type: 'switch-role', role }),
  reset: (firstTime = false) => post<{ role: Role }>(KEYS.session, { type: 'reset', firstTime }),
}
