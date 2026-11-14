'use client'

import { useState } from 'react'
import { Check, Copy, KeyRound, Send, Watch } from 'lucide-react'
import { toast } from 'sonner'
import { mutate } from 'swr'
import { KEYS } from '@/lib/client/api'
import { useGame } from '@/components/app/game-provider'
import { GameButton, Tag } from '@/components/app/game-ui'
import { timeAgo } from '@/lib/dates'
import type { DeviceConnection } from '@/lib/types'

const INGEST_PATH = '/api/health/ingest'

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Copy failed. Select the text and copy it by hand.')
    }
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-bold">{label}</span>
      <div className="flex items-stretch gap-2">
        <code className="min-w-0 flex-1 break-all rounded-md border-2 border-border bg-muted px-3 py-2 font-mono text-sm">{value}</code>
        <GameButton variant="secondary" className="min-h-10 shrink-0 px-3" onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          <span className="sr-only sm:not-sr-only">{copied ? 'Copied' : 'Copy'}</span>
        </GameButton>
      </div>
    </div>
  )
}

function SetupSteps({ keyText }: { keyText: string }) {
  return (
    <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
      <li>On the iPhone paired with your Apple Watch, open <strong>Shortcuts</strong> and tap <strong>+</strong>.</li>
      <li>
        Add <strong>Find Health Samples</strong> for <em>Heart Rate</em>: sort by Start Date, Latest First, limit 1. Repeat for{' '}
        <em>Resting Heart Rate</em> and <em>Blood Oxygen</em>.
      </li>
      <li>
        Add <strong>Find Health Samples</strong> for <em>Steps</em> where Start Date is Today, then <strong>Calculate Statistics</strong> → Sum.
      </li>
      <li>
        Add <strong>Get Contents of URL</strong>. URL: the address above. Method: <strong>POST</strong>. Add a header{' '}
        <code className="font-mono">Authorization</code> with value <code className="font-mono">Bearer {keyText}</code>.
      </li>
      <li>
        Set Request Body to <strong>JSON</strong> with the fields <code className="font-mono">heartRate</code>,{' '}
        <code className="font-mono">restingHeartRate</code>, <code className="font-mono">oxygen</code> and <code className="font-mono">steps</code>, each set
        to its matching result.
      </li>
      <li>Add <strong>Show Result</strong> so you can see the reply, then run the shortcut once and allow Health access.</li>
      <li>
        In the <strong>Automation</strong> tab, create a daily <em>Time of Day</em> automation that runs this shortcut, set to <em>Run Immediately</em>.
      </li>
    </ol>
  )
}

export function AppleHealthSync({ device }: { device: DeviceConnection }) {
  const { run } = useGame()
  const [freshKey, setFreshKey] = useState<string | null>(null)
  const [showSteps, setShowSteps] = useState(false)
  const [busy, setBusy] = useState(false)
  const endpoint = typeof window === 'undefined' ? INGEST_PATH : `${window.location.origin}${INGEST_PATH}`
  const connected = device.status === 'connected'

  const createKey = async () => {
    if (connected && !window.confirm('Make a new key? The shortcut using the old key will stop working until you update it.')) return
    setBusy(true)
    const result = await run({ type: 'healthsync.createKey' }, { quiet: true })
    setBusy(false)
    if (result?.syncKey) {
      setFreshKey(result.syncKey)
      setShowSteps(true)
    }
  }

  const revoke = async () => {
    if (!window.confirm('Turn off Apple Watch sync? Your shortcut will stop sending readings.')) return
    const result = await run({ type: 'healthsync.revoke' }, { success: 'Apple Watch sync turned off' })
    if (result) {
      setFreshKey(null)
      setShowSteps(false)
    }
  }

  const sendTest = async () => {
    if (!freshKey) return
    setBusy(true)
    try {
      const res = await fetch(INGEST_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${freshKey}` },
        body: JSON.stringify({ heartRate: 72, steps: 1200 }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(body.message ?? 'Test reading saved')
        await mutate(KEYS.patient)
      } else toast.error(body.message ?? 'Test failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border-2 border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-bold">
          <Watch className="size-5" aria-hidden /> Apple Watch (Apple Health)
        </p>
        {connected ? <Tag tone="green">Connected</Tag> : <Tag>Not set up</Tag>}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {connected
          ? `Sync key ending in ${device.syncKeyHint ?? '····'}. ${device.lastSync ? `Last reading ${timeAgo(device.lastSync)}.` : 'No readings received yet.'}`
          : 'Send heart rate, resting heart rate, blood oxygen and steps from your Apple Watch using a free Apple Shortcut on your iPhone.'}
      </p>

      {freshKey && (
        <div className="flex flex-col gap-3 rounded-lg border-2 border-primary bg-secondary p-3">
          <p className="text-sm font-bold">Copy your key now. For your safety, it is only shown once.</p>
          <CopyField label="Address (URL)" value={endpoint} />
          <CopyField label="Sync key" value={freshKey} />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Keep this key private, like a password. If you publish the app, use its live web address instead of this preview address.
          </p>
        </div>
      )}

      {showSteps && <SetupSteps keyText={freshKey ?? 'YOUR-KEY'} />}

      <div className="flex flex-wrap gap-2">
        <GameButton className="min-h-10 px-3" onClick={createKey} disabled={busy}>
          <KeyRound aria-hidden /> {connected ? 'Make a new key' : 'Set up Apple Watch sync'}
        </GameButton>
        {freshKey && (
          <GameButton variant="secondary" className="min-h-10 px-3" onClick={sendTest} disabled={busy}>
            <Send aria-hidden /> Send a test reading
          </GameButton>
        )}
        {connected && !freshKey && (
          <GameButton variant="secondary" className="min-h-10 px-3" onClick={() => setShowSteps((s) => !s)} aria-expanded={showSteps}>
            {showSteps ? 'Hide setup steps' : 'Show setup steps'}
          </GameButton>
        )}
        {connected && (
          <GameButton variant="secondary" className="min-h-10 px-3" onClick={revoke} disabled={busy}>
            Turn off
          </GameButton>
        )}
      </div>
    </li>
  )
}
