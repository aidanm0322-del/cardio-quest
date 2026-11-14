import 'server-only'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { HttpError } from './service'

export function handle(fn: () => Promise<unknown>) {
  return fn()
    .then((body) => NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } }))
    .catch((err: unknown) => {
      if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status })
      if (err instanceof ZodError)
        return NextResponse.json({ error: 'Some details were not valid. Please check and try again.', issues: err.issues }, { status: 400 })
      console.error('[cardio-quest] API error', err)
      return NextResponse.json({ error: 'Something went wrong saving your data. Please try again.' }, { status: 500 })
    })
}
