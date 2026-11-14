'use client'

import { useState } from 'react'
import { CalendarDays, Paperclip, Send } from 'lucide-react'
import { useGame, usePatient } from '@/components/app/game-provider'
import { CallLink, GameButton, PageHeader, Panel, Tag } from '@/components/app/game-ui'
import { formatDateTime } from '@/lib/dates'
import { buildRecoverySummary } from '@/lib/summary'
import type { Attachment } from '@/lib/types'
import { cn } from '@/lib/utils'

const SUPPORT_TOPICS = ['Transportation to appointments', 'Help paying for medications', 'Home care or equipment', 'Talking to a counselor', 'Something else']

export function CareTeamView() {
  const data = usePatient().data!
  const { run } = useGame()
  const [body, setBody] = useState('')
  const [attach, setAttach] = useState(false)
  const [topic, setTopic] = useState(SUPPORT_TOPICS[0])
  const [note, setNote] = useState('')
  const upcoming = data.appointments.filter((a) => !a.attended).sort((a, b) => a.at.localeCompare(b.at))

  async function send() {
    if (!body.trim()) return
    const attachments: Attachment[] = attach ? [buildRecoverySummary(data)] : []
    const ok = await run({ type: 'message.send', body: body.trim(), attachments }, { success: 'Message sent to your care team' })
    if (ok) {
      setBody('')
      setAttach(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Care Team" description="Messages are for non-urgent questions. For chest pain, trouble breathing, or fainting, call 911." />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Panel title="Messages">
          <ol className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto" aria-label="Message history">
            {data.messages.length === 0 && <li className="text-muted-foreground">No messages yet. Say hello to your team.</li>}
            {data.messages.map((m) => (
              <li key={m.id} className={cn('max-w-[88%] rounded-xl p-4', m.from === 'patient' ? 'self-end bg-navy text-navy-foreground' : 'self-start border-2 border-border bg-card')}>
                <p className="text-sm font-semibold opacity-80">
                  {m.author} · {formatDateTime(m.at)}
                </p>
                <p className="whitespace-pre-wrap">{m.body}</p>
                {m.attachments.map((a, i) => (
                  <details key={i} className="mt-2 rounded-lg bg-background/15 p-2 text-sm">
                    <summary className="cursor-pointer font-semibold">
                      <Paperclip className="mr-1 inline size-4" aria-hidden />
                      {a.label}
                    </summary>
                    <ul className="mt-1 list-disc pl-5">
                      {a.lines.map((l, j) => (
                        <li key={j}>{l}</li>
                      ))}
                    </ul>
                  </details>
                ))}
              </li>
            ))}
          </ol>
          <form
            className="mt-4 flex flex-col gap-3 border-t-2 border-border pt-4"
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
          >
            <label htmlFor="msg" className="font-semibold">
              New message
            </label>
            <textarea id="msg" rows={3} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} className="cq-input" placeholder="Ask a question or share an update…" />
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} className="size-5 accent-primary" />
              Attach my 7-day recovery summary
            </label>
            <GameButton type="submit" disabled={!body.trim()} className="self-start">
              <Send aria-hidden /> Send message
            </GameButton>
          </form>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title="Your team">
            <ul className="flex flex-col gap-4">
              {data.careTeam.map((c) => (
                <li key={c.id} className="flex flex-col gap-2 border-b-2 border-border pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-lg font-bold">{c.name}</p>
                    <p className="text-muted-foreground">
                      {c.role} · {c.organization}
                    </p>
                  </div>
                  <p className="text-sm">{c.bio}</p>
                  <p className="text-sm text-muted-foreground">Usually replies {c.responseTime}</p>
                  <CallLink phone={c.phone} label={`Call ${c.phone}`} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Appointments">
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground">No upcoming appointments.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {upcoming.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    <div>
                      <p className="font-bold">{a.title}</p>
                      <p>{formatDateTime(a.at)}</p>
                      <p className="text-sm text-muted-foreground">{a.location}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="Ask for support" action={<Tag tone="blue">Social work</Tag>}>
        <form
          className="grid gap-4 md:grid-cols-[16rem_1fr_auto] md:items-end"
          onSubmit={async (e) => {
            e.preventDefault()
            const ok = await run({ type: 'support.request', topic, note: note.trim() }, { success: 'Request sent. Someone will reach out.' })
            if (ok) setNote('')
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">I need help with</span>
            <select className="cq-input" value={topic} onChange={(e) => setTopic(e.target.value)}>
              {SUPPORT_TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Details (optional)</span>
            <input className="cq-input" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <GameButton type="submit" variant="secondary">
            Send request
          </GameButton>
        </form>
      </Panel>
    </div>
  )
}
