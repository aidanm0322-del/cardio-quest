'use client'

import { Phone, Siren } from 'lucide-react'
import { usePatient } from '@/components/app/game-provider'
import { CallLink, Panel } from '@/components/app/game-ui'

const CALL_911 = [
  'Chest pain, pressure, or tightness',
  'Severe shortness of breath or trouble breathing',
  'Fainting or passing out',
  'Face drooping, arm weakness, or slurred speech',
  'A very fast or irregular heartbeat with dizziness',
]

const CALL_TEAM = [
  'Fever over 101°F (38.3°C)',
  'Redness, warmth, or drainage at your incision',
  'New swelling in your legs or a weight gain of 3+ lbs in a day',
  'Feeling dizzy when you stand',
]

export function EmergencyView() {
  const { data } = usePatient()
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <section className="flex flex-col items-center gap-4 rounded-2xl border-[3px] border-destructive bg-heart-soft p-6 text-center md:p-8" aria-labelledby="em-title">
        <Siren className="size-12 text-destructive" aria-hidden />
        <h1 id="em-title" className="text-3xl font-extrabold text-balance text-navy md:text-4xl">
          If this is an emergency, call 911 now
        </h1>
        <a href="tel:911" className="inline-flex min-h-16 items-center gap-3 rounded-xl bg-destructive px-8 text-2xl font-extrabold text-destructive-foreground hover:bg-destructive/90">
          <Phone className="size-7" aria-hidden /> Call 911
        </a>
        <p className="text-lg">Don&apos;t drive yourself. Unlock your door if you can, and sit or lie down while you wait.</p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Call 911 for">
          <ul className="flex list-disc flex-col gap-2 pl-6 text-lg">
            {CALL_911.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="Call your care team for">
          <ul className="flex list-disc flex-col gap-2 pl-6 text-lg">
            {CALL_TEAM.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          {data && (
            <div className="mt-4 flex flex-col gap-2">
              {data.careTeam.slice(0, 2).map((c) => (
                <CallLink key={c.id} phone={c.phone} label={`${c.name} · ${c.phone}`} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Emotional crisis">
        <p className="text-lg">
          If you are thinking about harming yourself, call or text{' '}
          <a href="tel:988" className="font-bold underline">
            988
          </a>{' '}
          — the Suicide &amp; Crisis Lifeline, available 24/7.
        </p>
      </Panel>
    </div>
  )
}
