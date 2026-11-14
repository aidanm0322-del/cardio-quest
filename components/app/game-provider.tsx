'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { toast } from 'sonner'
import { ApiError, KEYS, api, type Action } from '@/lib/client/api'
import { playChime } from '@/lib/client/sound'
import type { ActionResult, Alert, CelebrationPayload, PatientView } from '@/lib/types'
import { CelebrationOverlay } from './celebration-overlay'
import { UrgentAlertOverlay } from './urgent-alert-overlay'

interface GameContext {
  /** Run a patient action. Urgent alerts always take priority over celebrations. */
  run: (action: Action, opts?: { success?: string; quiet?: boolean }) => Promise<ActionResult | null>
  showAlert: (alert: Alert) => void
  setView: (view: PatientView) => void
}

const Ctx = createContext<GameContext | null>(null)

export function usePatient() {
  return useSWR<PatientView, ApiError>(KEYS.patient, api.patient, { revalidateOnFocus: true, shouldRetryOnError: false })
}

export function useGame() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { mutate } = useSWRConfig()
  const { data } = usePatient()
  const [celebration, setCelebration] = useState<CelebrationPayload | null>(null)
  const [alert, setAlert] = useState<Alert | null>(null)

  const settings = data?.profile.settings
  useEffect(() => {
    if (!settings) return
    const html = document.documentElement
    html.dataset.textSize = settings.textSize
    html.dataset.reduceMotion = String(settings.reduceMotion)
  }, [settings])

  const setView = useCallback((view: PatientView) => void mutate(KEYS.patient, view, { revalidate: false }), [mutate])

  const showAlert = useCallback((a: Alert) => {
    setCelebration(null)
    setAlert(a)
  }, [])

  const run = useCallback<GameContext['run']>(
    async (action, opts) => {
      try {
        const result = await api.act(action)
        setView(result.view)
        if (result.alert) {
          showAlert(result.alert)
          if (result.celebration) toast.success(`Saved. +${result.celebration.xpEarned} XP for checking in.`)
        } else if (result.celebration) {
          setCelebration(result.celebration)
          if (result.view.profile.settings.soundOn) playChime()
        } else if (opts?.success && !opts.quiet) {
          toast.success(opts.success)
        }
        return result
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not save. Please try again.')
        return null
      }
    },
    [setView, showAlert],
  )

  const value = useMemo(() => ({ run, showAlert, setView }), [run, showAlert, setView])

  return (
    <Ctx.Provider value={value}>
      {children}
      {celebration && data && !alert && (
        <CelebrationOverlay payload={celebration} character={data.character} reduceMotion={data.profile.settings.reduceMotion} onClose={() => setCelebration(null)} />
      )}
      {alert && <UrgentAlertOverlay alert={alert} careTeam={data?.careTeam ?? []} onClose={() => setAlert(null)} />}
    </Ctx.Provider>
  )
}
