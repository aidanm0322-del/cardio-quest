'use client'

import useSWR from 'swr'
import { ErrorState, LoadingState, Panel, Tag } from '@/components/app/game-ui'
import { api, KEYS, type ApiError } from '@/lib/client/api'
import { formatClock, formatDateTime, timeAgo } from '@/lib/dates'
import type { CaregiverView as View } from '@/lib/types'

export function CaregiverView() {
  const { data, error, mutate } = useSWR<View, ApiError>(KEYS.caregiver, api.caregiver, { shouldRetryOnError: false })

  return (
    <main id="main" className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 md:px-8">
      {error ? (
        <ErrorState message={error.status === 403 ? 'Switch to the caregiver role in the demo bar to see this view.' : error.message} onRetry={error.status === 403 ? undefined : () => mutate()} />
      ) : !data ? (
        <LoadingState label="Loading…" />
      ) : data.status !== 'active' ? (
        <Panel title="No access right now">
          <p className="text-lg">{data.status === 'invited' ? `${data.patientName} has invited you. Accept the invite to see updates.` : `${data.patientName} isn't sharing updates with you at the moment.`}</p>
        </Panel>
      ) : (
        <>
          <header>
            <p className="font-semibold text-primary">Hi {data.caregiverName.split(' ')[0]}</p>
            <h1 className="text-3xl font-extrabold text-balance">{data.patientName}&apos;s recovery · Day {data.recoveryDay}</h1>
            <p className="text-muted-foreground">You see only what {data.patientName} chose to share.</p>
          </header>

          {data.medications && (
            <Panel title="Today's medications" action={data.adherence7d && <Tag tone="blue">{data.adherence7d.pct}% this week</Tag>}>
              <ul className="flex flex-col gap-2">
                {data.medications.map((m, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 border-b-2 border-border pb-2 last:border-0">
                    <span>
                      {formatClock(m.time)} · {m.name}
                    </span>
                    <Tag tone={m.status === 'taken' ? 'green' : m.status === 'pending' ? 'neutral' : 'gold'}>{m.status}</Tag>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {data.appointments && (
            <Panel title="Upcoming appointments">
              {data.appointments.length === 0 ? (
                <p className="text-muted-foreground">None scheduled.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.appointments.map((a) => (
                    <li key={a.id}>
                      <p className="font-semibold">{a.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(a.at)} · {a.location}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          {data.milestones && (
            <Panel title="Milestones">
              <ul className="flex flex-col gap-2">
                {data.milestones.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3">
                    <span>{m.title}</span>
                    {m.completedAt ? <Tag tone="green">Done</Tag> : <Tag>Day {m.targetDay}</Tag>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {data.healthUpdates && (
            <Panel title="Health updates">
              <ul className="flex flex-col gap-2">
                {data.healthUpdates.map((h, i) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <span>{h.label}</span>
                    <span className="font-semibold">
                      {h.value} <span className="text-sm font-normal text-muted-foreground">{timeAgo(h.at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
    </main>
  )
}
