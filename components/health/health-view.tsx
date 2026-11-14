'use client'

import { useState } from 'react'
import { Activity, Droplets, Footprints, HeartPulse, RefreshCw } from 'lucide-react'
import { useGame, usePatient } from '@/components/app/game-provider'
import { GameButton, PageHeader, Panel, Tag } from '@/components/app/game-ui'
import { formatDateTime, timeAgo } from '@/lib/dates'
import type { MetricType, Reading } from '@/lib/types'
import { cn } from '@/lib/utils'

const METRICS: { id: MetricType; label: string; unit: string; icon: typeof HeartPulse; normal: string }[] = [
  { id: 'heartRate', label: 'Heart rate', unit: 'bpm', icon: HeartPulse, normal: 'Resting 60–100 bpm' },
  { id: 'bloodPressure', label: 'Blood pressure', unit: 'mmHg', icon: Activity, normal: 'Goal under 130/80' },
  { id: 'oxygen', label: 'Oxygen', unit: '%', icon: Droplets, normal: '95% or higher' },
  { id: 'steps', label: 'Steps today', unit: 'steps', icon: Footprints, normal: 'Follow your walking plan' },
]

const fmt = (r: Reading) => (r.metric === 'bloodPressure' ? `${r.value}/${r.value2 ?? '–'}` : r.metric === 'steps' ? r.value.toLocaleString() : String(r.value))

export function HealthView() {
  const data = usePatient().data!
  const { run } = useGame()
  const [metric, setMetric] = useState<MetricType>('heartRate')
  const [value, setValue] = useState('')
  const [value2, setValue2] = useState('')

  const byMetric = (m: MetricType) => data.readings.filter((r) => r.metric === m).sort((a, b) => a.at.localeCompare(b.at))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Health Data" description="Readings from your devices or entered by hand. Your care team sees these too. Unusual readings trigger safety guidance." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((m) => {
          const list = byMetric(m.id)
          const last = list.at(-1)
          return (
            <section key={m.id} className="pixel-frame flex flex-col gap-2 bg-card p-4" aria-labelledby={`m-${m.id}`}>
              <div className="flex items-center gap-2">
                <m.icon className="size-5 text-primary" aria-hidden />
                <h2 id={`m-${m.id}`} className="font-bold">
                  {m.label}
                </h2>
              </div>
              <p className="font-pixel text-3xl text-navy">
                {last ? fmt(last) : '—'} <span className="font-sans text-base text-muted-foreground">{m.unit}</span>
              </p>
              <Spark values={list.slice(-10).map((r) => r.value)} label={m.label} />
              <p className="text-sm text-muted-foreground">{last ? `${timeAgo(last.at)} · ${last.source.name}` : 'No readings yet'}</p>
              <p className="text-sm">{m.normal}</p>
            </section>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Add a reading">
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault()
              const v = Number(value)
              if (!Number.isFinite(v) || value === '') return
              const ok = await run(
                { type: 'reading.add', metric, value: v, value2: metric === 'bloodPressure' && value2 ? Number(value2) : undefined },
                { success: 'Reading saved' },
              )
              if (ok) {
                setValue('')
                setValue2('')
              }
            }}
          >
            <label className="flex flex-col gap-1.5">
              <span className="font-semibold">Type</span>
              <select className="cq-input" value={metric} onChange={(e) => setMetric(e.target.value as MetricType)}>
                {METRICS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-3">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="font-semibold">{metric === 'bloodPressure' ? 'Systolic (top)' : `Value (${METRICS.find((m) => m.id === metric)!.unit})`}</span>
                <input className="cq-input" type="number" inputMode="numeric" min={0} required value={value} onChange={(e) => setValue(e.target.value)} />
              </label>
              {metric === 'bloodPressure' && (
                <label className="flex flex-1 flex-col gap-1.5">
                  <span className="font-semibold">Diastolic (bottom)</span>
                  <input className="cq-input" type="number" inputMode="numeric" min={0} max={300} required value={value2} onChange={(e) => setValue2(e.target.value)} />
                </label>
              )}
            </div>
            <GameButton type="submit" className="self-start">
              Save reading
            </GameButton>
          </form>
        </Panel>

        <Panel title="Connected devices">
          <ul className="flex flex-col gap-3">
            {data.devices.map((d) => (
              <li key={d.id} className="flex flex-col gap-2 rounded-lg border-2 border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{d.name}</p>
                  {d.status === 'connected' && <Tag tone="green">Connected</Tag>}
                  {d.status === 'disconnected' && <Tag>Disconnected</Tag>}
                  {d.status === 'not-implemented' && <Tag tone="demo">Coming soon</Tag>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {d.note}
                  {d.lastSync && ` Last sync ${timeAgo(d.lastSync)}.`}
                </p>
                {d.status !== 'not-implemented' && (
                  <div className="flex flex-wrap gap-2">
                    {d.status === 'connected' && (
                      <GameButton variant="secondary" className="min-h-10 px-3" onClick={() => run({ type: 'device.sync', deviceId: d.id }, { success: `${d.name} synced` })}>
                        <RefreshCw aria-hidden /> Sync now
                      </GameButton>
                    )}
                    <GameButton
                      variant="secondary"
                      className="min-h-10 px-3"
                      onClick={() => run({ type: 'device.toggle', deviceId: d.id, connect: d.status !== 'connected' }, { success: d.status === 'connected' ? 'Disconnected' : 'Connected' })}
                    >
                      {d.status === 'connected' ? 'Disconnect' : 'Connect'}
                    </GameButton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Recent readings">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left">
            <thead className="text-sm text-muted-foreground">
              <tr>
                <th className="py-2 font-semibold">When</th>
                <th className="py-2 font-semibold">Type</th>
                <th className="py-2 font-semibold">Value</th>
                <th className="py-2 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {[...data.readings]
                .sort((a, b) => b.at.localeCompare(a.at))
                .slice(0, 12)
                .map((r) => (
                  <tr key={r.id} className="border-t-2 border-border">
                    <td className="py-2">{formatDateTime(r.at)}</td>
                    <td className="py-2">{METRICS.find((m) => m.id === r.metric)?.label}</td>
                    <td className="py-2 font-semibold">
                      {fmt(r)} {r.unit}
                    </td>
                    <td className="py-2 text-muted-foreground">{r.source.name}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

function Spark({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return <div className="h-10" />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  return (
    <div className="flex h-10 items-end gap-1" role="img" aria-label={`${label} trend: ${values.join(', ')}`}>
      {values.map((v, i) => (
        <div key={i} className={cn('flex-1 rounded-t-sm', i === values.length - 1 ? 'bg-primary' : 'bg-sky')} style={{ height: `${20 + ((v - min) / range) * 80}%` }} />
      ))}
    </div>
  )
}
