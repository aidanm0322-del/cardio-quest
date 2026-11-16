'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { DialogueBox, EmergencyButton, GameButton } from '@/components/app/game-ui'
import { PixelCharacter } from '@/components/character/pixel-character'
import { KEYS, api, type LockedRole } from '@/lib/client/api'
import type { CharacterAppearance } from '@/lib/types'
import { cn } from '@/lib/utils'

// Matches Sunny's look in the sample data (lib/server/seed.ts → DEFAULT_CHARACTER).
const SUNNY: CharacterAppearance = {
  name: 'Sunny',
  skin: 'golden',
  hairStyle: 'bun',
  hairColor: 'silver',
  eyeColor: 'brown',
  outfit: 'jacket',
  outfitColor: 'blue',
  pantsColor: 'navy',
  shoes: 'sneakers',
  shoeColor: 'red',
  hat: 'none',
  glasses: 'round',
  accessory: 'scarf',
}

const HOME: Record<LockedRole | 'patient', string> = { patient: '/hub', clinician: '/clinician', caregiver: '/caregiver' }
const LABEL: Record<LockedRole, string> = { clinician: 'Clinician', caregiver: 'Caregiver' }

export function LoginScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const { mutate } = useSWRConfig()
  const { data: session } = useSWR(KEYS.session, api.session)
  const asked = params.get('role')
  const [role, setRole] = useState<LockedRole>(asked === 'caregiver' ? 'caregiver' : 'clinician')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<'demo' | 'login' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const logins = session?.logins
  const anyLogin = !logins || logins.clinician || logins.caregiver
  const roleReady = !logins || logins[role]

  async function enter(kind: 'demo' | 'login') {
    setBusy(kind)
    setError(null)
    try {
      const { role: signedIn } = kind === 'demo' ? await api.demoLogin() : await api.login(role, password)
      // Drop any data cached for a previous visitor before showing the next screen.
      await mutate(() => true, undefined, { revalidate: true })
      router.replace(HOME[signedIn ?? 'patient'])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in. Please try again.')
      setBusy(null)
    }
  }

  return (
    <main id="main" className="relative flex min-h-dvh flex-col overflow-hidden">
      <Image src="/world/welcome-scene.png" alt="" fill priority className="pixel-render object-cover object-bottom" sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/10 via-transparent to-navy/20" aria-hidden />

      <div className="relative z-10 flex justify-end p-4">
        <EmergencyButton />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-4 pb-10">
        <div className="pixel-frame flex items-center gap-3 bg-card/95 px-5 py-3">
          <Image src="/brand/cardio-quest-logo.jpg" alt="" width={56} height={56} className="size-14 rounded-md object-cover object-[50%_38%]" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              <span className="text-navy">Cardio</span> <span className="text-primary">Quest</span>
            </h1>
            <p className="font-semibold text-navy">Your journey towards better living</p>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-4 md:flex-row md:items-start md:justify-center md:gap-8">
          <PixelCharacter appearance={SUNNY} pose="wave" size={180} label="Sunny waving hello" />

          <div className="flex w-full max-w-md flex-col gap-4">
            <DialogueBox speaker="Sunny" tail="none">
              Hi! I&apos;m Sunny. Step into Maggie&apos;s recovery journey — three weeks after her heart surgery.
            </DialogueBox>

            <GameButton onClick={() => enter('demo')} disabled={busy !== null} className="py-4 text-lg">
              {busy === 'demo' ? 'Opening the demo…' : 'Try the demo as Sunny'}
            </GameButton>
            <p className="-mt-2 text-center text-sm font-medium text-navy">No password needed · starts fresh with sample data</p>

            {anyLogin && (
              <form
                className="pixel-frame flex flex-col gap-3 bg-card p-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (password) void enter('login')
                }}
              >
                <h2 className="text-lg font-bold text-navy">Care team sign-in</h2>

                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Sign in as">
                  {(['clinician', 'caregiver'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={role === r}
                      onClick={() => {
                        setRole(r)
                        setError(null)
                      }}
                      className={cn(
                        'min-h-11 rounded-lg border-2 font-semibold',
                        role === r ? 'border-navy bg-navy text-navy-foreground' : 'border-border hover:bg-muted',
                      )}
                    >
                      {LABEL[r]}
                    </button>
                  ))}
                </div>

                {roleReady ? (
                  <>
                    <label className="flex flex-col gap-1.5 font-semibold" htmlFor="password">
                      Password
                      <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="min-h-11 rounded-lg border-2 border-border bg-background px-3 text-base font-normal focus-visible:border-navy focus-visible:outline-none"
                        aria-invalid={!!error}
                        aria-describedby={error ? 'login-error' : undefined}
                      />
                    </label>
                    {error && (
                      <p id="login-error" role="alert" className="font-semibold text-destructive">
                        {error}
                      </p>
                    )}
                    <GameButton type="submit" variant="secondary" disabled={busy !== null || !password}>
                      {busy === 'login' ? 'Signing in…' : `Sign in as ${LABEL[role].toLowerCase()}`}
                    </GameButton>
                  </>
                ) : (
                  <p className="text-muted-foreground">{LABEL[role]} sign-in isn&apos;t set up on this site yet.</p>
                )}
              </form>
            )}

            {!anyLogin && error && (
              <p role="alert" className="pixel-frame bg-card px-4 py-2 font-semibold text-destructive">
                {error}
              </p>
            )}
          </div>
        </div>

        <p className="pixel-frame max-w-xl bg-card/95 px-4 py-2 text-center text-sm">
          Demo with a fictional patient. Cardio Quest supports your care plan — it does not replace your care team or emergency services.
        </p>
      </div>
    </main>
  )
}
