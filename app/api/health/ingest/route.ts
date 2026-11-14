import { NextResponse } from 'next/server'
import { HttpError, ingestAppleSamples, verifySyncKey, type HealthSample } from '@/lib/server/service'
import { mutateState } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

const MAX_BODY = 16_000

/**
 * Apple Shortcuts may send numbers, strings like "4,215", or newline-joined
 * sample lists. Use the first numeric value.
 */
function toNumber(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === '') return null
  const first = Array.isArray(raw) ? raw[0] : raw
  if (typeof first === 'number') return Number.isFinite(first) ? first : null
  if (typeof first !== 'string') return null
  const token = first.split('\n').map((s) => s.trim()).find(Boolean)
  if (!token) return null
  const n = Number(token.replace(/,/g, '').replace(/[^\d.\-]/g, ''))
  return Number.isFinite(n) ? n : null
}

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const key = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!key) return json({ ok: false, message: 'Missing sync key. Add an Authorization header: Bearer <your key>.' }, 401)

  const text = await req.text()
  if (text.length > MAX_BODY) return json({ ok: false, message: 'Request is too large.' }, 413)
  let body: Record<string, unknown>
  try {
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    body = parsed
  } catch {
    return json({ ok: false, message: 'Send the readings as a JSON dictionary.' }, 400)
  }

  const samples: HealthSample[] = []
  const skipped: string[] = []
  const add = (field: string, min: number, max: number, make: (v: number) => HealthSample) => {
    const v = toNumber(body[field])
    if (v === null) return
    if (v < min || v > max) skipped.push(`${field} (${v}) is outside ${min}–${max}`)
    else samples.push(make(Math.round(v)))
  }

  add('heartRate', 25, 250, (value) => ({ metric: 'heartRate', value, label: 'Apple Watch' }))
  add('restingHeartRate', 25, 200, (value) => ({ metric: 'heartRate', value, label: 'Apple Watch (resting)' }))
  add('steps', 0, 100_000, (value) => ({ metric: 'steps', value, label: 'Apple Watch' }))

  const o2 = toNumber(body.oxygen)
  if (o2 !== null) {
    const pct = o2 <= 1 ? o2 * 100 : o2
    if (pct < 50 || pct > 100) skipped.push(`oxygen (${o2}) is outside 50–100%`)
    else samples.push({ metric: 'oxygen', value: Math.round(pct), label: 'Apple Watch' })
  }

  const sys = toNumber(body.systolic)
  const dia = toNumber(body.diastolic)
  if (sys !== null || dia !== null) {
    if (sys === null || dia === null) skipped.push('blood pressure needs both systolic and diastolic')
    else if (sys < 60 || sys > 260 || dia < 30 || dia > 160) skipped.push(`blood pressure (${sys}/${dia}) is out of range`)
    else samples.push({ metric: 'bloodPressure', value: Math.round(sys), value2: Math.round(dia), label: 'Apple Health' })
  }

  let at = new Date().toISOString()
  if (typeof body.at === 'string' && body.at) {
    const t = Date.parse(body.at)
    const now = Date.now()
    if (Number.isFinite(t) && t <= now + 5 * 60_000 && t >= now - 7 * 86_400_000) at = new Date(t).toISOString()
  }

  if (samples.length === 0) {
    return json({ ok: false, message: skipped.length ? `Nothing saved: ${skipped.join('; ')}.` : 'No readings found. Send heartRate, restingHeartRate, oxygen, steps, or systolic + diastolic.', skipped }, 400)
  }

  try {
    const { result: alerts } = await mutateState((state) => {
      if (!verifySyncKey(state, key)) throw new HttpError(401, 'This sync key is not valid. Create a new one on the Health page.')
      return ingestAppleSamples(state, samples, at)
    })
    const urgent = alerts.find((a) => a.severity === 'emergency')
    const message = urgent
      ? `Saved. ${urgent.action}`
      : `Saved ${samples.length} reading${samples.length === 1 ? '' : 's'} to Cardio Quest.${alerts.length ? ' Your care team was notified about an unusual reading.' : ''}`
    return json({ ok: true, saved: samples.length, alerts: alerts.length, skipped, message })
  } catch (err) {
    if (err instanceof HttpError) return json({ ok: false, message: err.message }, err.status)
    console.error('[cardio-quest] Apple Health ingest failed', err)
    return json({ ok: false, message: 'Something went wrong saving your readings. Try again shortly.' }, 500)
  }
}
