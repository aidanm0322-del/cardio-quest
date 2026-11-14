'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { usePatient, useGame } from '@/components/app/game-provider'
import { DialogueBox, EmergencyButton, GameButton, LoadingState } from '@/components/app/game-ui'
import { PixelCharacter } from '@/components/character/pixel-character'
import { PRESETS } from '@/lib/character/options'
import { partOfDay } from '@/lib/dates'

const GUIDE = { ...PRESETS[0].appearance, name: 'Pip' }

export function WelcomeScreen() {
  const router = useRouter()
  const { data, error } = usePatient()
  const { run } = useGame()
  const onboarded = data?.profile.onboarded

  useEffect(() => {
    if (data?.profile.onboarded && !data.profile.settings.showWelcome) router.replace('/hub')
  }, [data, router])

  const character = onboarded && data ? data.character : GUIDE
  const remaining = data?.quests.filter((q) => !q.done).length ?? 0

  return (
    <main id="main" className="relative flex min-h-[calc(100dvh-2.5rem)] flex-col overflow-hidden">
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

        {error?.status === 403 ? (
          <div className="pixel-frame flex max-w-lg flex-col items-center gap-3 bg-card p-6 text-center">
            <p className="text-lg">You&apos;re viewing the demo as a care team member or caregiver.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <GameButton href="/clinician">Clinician dashboard</GameButton>
              <GameButton href="/caregiver" variant="secondary">
                Caregiver view
              </GameButton>
            </div>
          </div>
        ) : !data ? (
          <div className="pixel-frame bg-card px-6">
            <LoadingState label="Opening the gates…" />
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-4 md:flex-row md:items-end md:justify-center md:gap-8">
            <PixelCharacter appearance={character} pose="wave" size={220} label={`${character.name} waving hello`} />
            <div className="flex w-full max-w-lg flex-col gap-4">
              <DialogueBox speaker={character.name} tail="left" className="hidden md:block">
                {onboarded ? (
                  <>
                    Good {partOfDay()}, {data.profile.preferredName}! You&apos;re on day {data.recoveryDay} of your recovery.{' '}
                    {remaining > 0 ? `${remaining} care quest${remaining === 1 ? '' : 's'} are waiting today.` : 'Every quest is done today — wonderful.'}
                  </>
                ) : (
                  <>Hi there! I&apos;m {character.name}. Welcome to Cardio Quest. I&apos;ll help you follow your recovery plan, one small quest at a time.</>
                )}
              </DialogueBox>
              <DialogueBox speaker={character.name} tail="none" className="md:hidden">
                {onboarded ? `Welcome back, ${data.profile.preferredName}! Day ${data.recoveryDay} of your journey.` : `Hi! I'm ${character.name}. Let's begin your recovery quest.`}
              </DialogueBox>

              <div className="flex flex-col gap-3 sm:flex-row">
                {onboarded ? (
                  <GameButton href="/hub" className="flex-1 py-4 text-lg">
                    Continue Journey
                  </GameButton>
                ) : (
                  <GameButton href="/onboarding" className="flex-1 py-4 text-lg">
                    Begin My Quest
                  </GameButton>
                )}
                {onboarded && (
                  <GameButton href="/companion" variant="secondary" className="flex-1 py-4 text-lg">
                    Talk to {character.name}
                  </GameButton>
                )}
              </div>
              {onboarded && (
                <label className="pixel-frame flex items-center gap-3 self-start bg-card/95 px-3 py-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="size-5 accent-primary"
                    checked={!data.profile.settings.showWelcome}
                    onChange={(e) => run({ type: 'settings.update', patch: { showWelcome: !e.target.checked } }, { quiet: true })}
                  />
                  Skip this welcome screen next time
                </label>
              )}
            </div>
          </div>
        )}

        <p className="pixel-frame max-w-xl bg-card/95 px-4 py-2 text-center text-sm">
          Cardio Quest supports your care plan — it does not replace your care team or emergency services.
        </p>
      </div>
    </main>
  )
}
