'use client'

import { useState } from 'react'
import { ShieldCheck, UserPlus } from 'lucide-react'
import { useGame, usePatient } from '@/components/app/game-provider'
import { GameButton, PageHeader, Panel, Tag } from '@/components/app/game-ui'
import { formatDate } from '@/lib/dates'
import type { CaregiverPermissions } from '@/lib/types'
import { cn } from '@/lib/utils'

const PERMS: { key: keyof CaregiverPermissions; label: string; detail: string }[] = [
  { key: 'medications', label: 'Medications', detail: "Today's doses and 7-day adherence" },
  { key: 'appointments', label: 'Appointments', detail: 'Upcoming visits and locations' },
  { key: 'milestones', label: 'Milestones', detail: 'Recovery goals and progress' },
  { key: 'healthUpdates', label: 'Health updates', detail: 'Latest readings and check-in pain level' },
]

const NEVER = ['Your journal', 'Companion conversations', 'Mood check-in notes', 'Messages with your care team']

export function CaregiverAccessView() {
  const data = usePatient().data!
  const { run } = useGame()
  const cg = data.caregiver
  const [form, setForm] = useState({ name: '', email: '', relationship: '' })
  const [perms, setPerms] = useState<CaregiverPermissions>({ medications: true, appointments: true, milestones: true, healthUpdates: false })
  const active = cg.status === 'invited' || cg.status === 'active'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Caregiver Access" description="Invite a family member or friend to follow along. You choose exactly what they see, and you can stop sharing at any time." />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {active ? (
          <Panel title={cg.name} action={cg.status === 'active' ? <Tag tone="green">Active</Tag> : <Tag tone="gold">Invite pending</Tag>}>
            <p className="text-muted-foreground">
              {cg.relationship && `${cg.relationship} · `}
              {cg.email}
              {cg.invitedAt && ` · Invited ${formatDate(cg.invitedAt)}`}
            </p>
            <h3 className="mt-5 mb-2 font-bold">What {cg.name.split(' ')[0]} can see</h3>
            <PermToggles value={cg.permissions} onChange={(p) => run({ type: 'caregiver.permissions', permissions: p }, { success: 'Sharing updated' })} />
            <div className="mt-5 flex flex-wrap gap-3">
              {cg.status === 'invited' && (
                <GameButton variant="secondary" onClick={() => run({ type: 'caregiver.simulateAccept' }, { success: 'Invite accepted (demo)' })}>
                  Simulate accept <Tag tone="demo">Demo</Tag>
                </GameButton>
              )}
              {cg.status === 'active' && (
                <GameButton variant="secondary" href="/caregiver">
                  Preview their view
                </GameButton>
              )}
              <GameButton variant="danger" onClick={() => run({ type: 'caregiver.revoke' }, { success: 'Access removed' })}>
                Stop sharing
              </GameButton>
            </div>
          </Panel>
        ) : (
          <Panel title="Invite a caregiver" action={<UserPlus className="size-5 text-primary" aria-hidden />}>
            {cg.status === 'revoked' && <p className="mb-4 rounded-lg bg-muted p-3">Access for {cg.name} was removed. You can invite someone new.</p>}
            <form
              className="flex flex-col gap-4"
              onSubmit={async (e) => {
                e.preventDefault()
                await run({ type: 'caregiver.invite', caregiver: { ...form, permissions: perms } }, { success: `Invite sent to ${form.email}` })
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="font-semibold">Name</span>
                  <input className="cq-input" required maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="off" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-semibold">Relationship</span>
                  <input className="cq-input" maxLength={40} placeholder="e.g. Daughter" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="font-semibold">Email</span>
                <input className="cq-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="off" />
              </label>
              <fieldset>
                <legend className="mb-2 font-bold">Share</legend>
                <PermToggles value={perms} onChange={setPerms} />
              </fieldset>
              <GameButton type="submit" className="self-start">
                Send invite
              </GameButton>
              <p className="text-sm text-muted-foreground">Demo: no email is actually sent.</p>
            </form>
          </Panel>
        )}

        <Panel title="Always private" action={<ShieldCheck className="size-5 text-success" aria-hidden />}>
          <p className="mb-3">Caregivers can never see:</p>
          <ul className="flex list-disc flex-col gap-1.5 pl-6">
            {NEVER.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

function PermToggles({ value, onChange }: { value: CaregiverPermissions; onChange: (p: CaregiverPermissions) => void }) {
  return (
    <ul className="flex flex-col gap-2">
      {PERMS.map((p) => (
        <li key={p.key}>
          <button
            type="button"
            role="switch"
            aria-checked={value[p.key]}
            onClick={() => onChange({ ...value, [p.key]: !value[p.key] })}
            className={cn('flex min-h-14 w-full items-center gap-3 rounded-lg border-2 p-3 text-left', value[p.key] ? 'border-primary bg-accent' : 'border-border')}
          >
            <span className={cn('relative h-6 w-11 shrink-0 rounded-full border-2 border-navy transition-colors', value[p.key] ? 'bg-primary' : 'bg-muted')}>
              <span className={cn('absolute top-0.5 size-4 rounded-full bg-card transition-all', value[p.key] ? 'left-5' : 'left-0.5')} />
            </span>
            <span>
              <span className="block font-semibold">{p.label}</span>
              <span className="block text-sm text-muted-foreground">{p.detail}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
