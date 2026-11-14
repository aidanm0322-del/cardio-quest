'use client'

import Link from 'next/link'
import { ArrowRight, CalendarDays, Check, Flag, HeartPulse, Pill, RotateCcw, Smile, Star, Stethoscope, BookOpen, Footprints } from 'lucide-react'
import { useGame, usePatient } from '@/components/app/game-provider'
import { DialogueBox, GameButton, Panel, Tag, XpBar } from '@/components/app/game-ui'
import { PixelCharacter } from '@/components/character/pixel-character'
import { formatClock, formatDateTime, partOfDay, timeAgo } from '@/lib/dates'
import type { Quest, QuestKind } from '@/lib/types'
import { cn } from '@/lib/utils'

const ICONS: Record<QuestKind, typeof Pill> = {
  medication: Pill,
  'symptom-check-in': HeartPulse,
  'mood-check-in': Smile,
  'review-instructions': BookOpen,
  appointment: CalendarDays,
  activity: Footprints,
}

export function QuestHub() {
  const data = usePatient().data!
  const { run } = useGame()
  const { character, profile, quests, level, recoveryDay } = data
  const done = quests.filter((q) => q.done).length
  const totalDays = profile.recoveryWeeks * 7
  const pct = Math.min(100, Math.round((recoveryDay / totalDays) * 100))
  const next = [...data.milestones].filter((m) => !m.completedAt).sort((a, b) => a.targetDay - b.targetDay)[0]
  const appt = [...data.appointments].filter((a) => new Date(a.at) > new Date()).sort((a, b) => a.at.localeCompare(b.at))[0]
  const apptWith = data.careTeam.find((c) => c.id === appt?.withId)
  const unreadReply = [...data.messages].reverse().find((m) => m.from === 'clinician')
  const openAlert = data.alerts.find((a) => !a.acknowledged)

  const pose = done === quests.length && quests.length > 0 ? 'cheer' : 'wave'
  const greeting =
    done === quests.length && quests.length > 0
      ? `You finished every quest today, ${profile.preferredName}! I'm so proud of you. Rest is part of recovery too.`
      : done === 0
        ? `Good ${partOfDay()}, ${profile.preferredName}! ${quests.length} quests are ready. Want to start with ${quests.find((q) => !q.done)?.title.toLowerCase() ?? 'a check-in'}?`
        : `Nice progress — ${done} of ${quests.length} quests done. Keep going at your own pace.`

  async function completeQuest(q: Quest) {
    if (q.kind === 'medication' && q.dose) await run({ type: 'dose.log', medId: q.dose.medId, time: q.dose.time, status: 'taken' })
    else await run({ type: 'quest.complete', key: q.key })
  }

  return (
    <div className="flex flex-col gap-6">
      {openAlert && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-destructive bg-heart-soft p-4">
          <HeartPulse className="size-6 text-destructive" aria-hidden />
          <p className="flex-1 font-semibold">
            Your care team was alerted: {openAlert.trigger}. {openAlert.action}
          </p>
          <GameButton variant="secondary" onClick={() => run({ type: 'alert.ack', id: openAlert.id }, { success: 'Marked as seen' })}>
            I&apos;ve seen this
          </GameButton>
        </div>
      )}

      <section aria-labelledby="hub-title" className="pixel-frame relative overflow-hidden bg-sky">
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-end md:p-8">
          <PixelCharacter appearance={character} pose={pose} size={190} className="mx-auto shrink-0 md:mx-0" label={`${character.name}, your companion`} />
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 id="hub-title" className="font-pixel text-3xl text-navy md:text-4xl">
                Day {recoveryDay}
              </h1>
              <span className="font-semibold text-navy/80">
                of {totalDays} · {profile.planName}
              </span>
            </div>
            <DialogueBox speaker={character.name}>{greeting}</DialogueBox>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-card/90 p-3">
                <XpBar level={level} />
              </div>
              <div className="flex flex-col justify-center gap-1.5 rounded-lg bg-card/90 p-3">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Recovery journey</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-sm border-2 border-navy bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Recovery journey progress">
                  <div className="h-full bg-success" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Panel
          title="Today's care quests"
          action={
            <Tag tone={done === quests.length ? 'green' : 'blue'}>
              {done}/{quests.length} done
            </Tag>
          }
        >
          <p className="mb-4 text-muted-foreground">Every quest comes from your care plan. Complete them for XP and new outfits for {character.name}.</p>
          <ul className="flex flex-col gap-3">
            {quests.map((q) => (
              <QuestRow key={q.key} quest={q} onComplete={() => completeQuest(q)} onUndo={() => run({ type: 'quest.undo', key: q.key }, { success: 'Quest marked not done' })} />
            ))}
          </ul>
        </Panel>

        <div className="flex flex-col gap-6">
          {next && (
            <Panel title="Next milestone" action={<Flag className="size-5 text-primary" aria-hidden />}>
              <p className="text-lg font-bold">{next.title}</p>
              <p className="mt-1 text-muted-foreground">
                Target: around day {next.targetDay}
                {next.targetDay > recoveryDay ? ` · ${next.targetDay - recoveryDay} days to go` : ' · ready when your care team agrees'}
              </p>
              <GameButton href="/map" variant="secondary" className="mt-4 w-full">
                Open journey map <ArrowRight aria-hidden />
              </GameButton>
            </Panel>
          )}
          {appt && (
            <Panel title="Next appointment" action={<CalendarDays className="size-5 text-primary" aria-hidden />}>
              <p className="text-lg font-bold">{appt.title}</p>
              <p className="mt-1">{formatDateTime(appt.at)}</p>
              <p className="text-muted-foreground">
                {apptWith?.name} · {appt.location}
              </p>
            </Panel>
          )}
          <Panel title="Care team" action={<Stethoscope className="size-5 text-primary" aria-hidden />}>
            {unreadReply ? (
              <p>
                <span className="font-semibold">{unreadReply.author}</span> replied {timeAgo(unreadReply.at)}: &ldquo;{unreadReply.body.slice(0, 90)}
                {unreadReply.body.length > 90 ? '…' : ''}&rdquo;
              </p>
            ) : (
              <p className="text-muted-foreground">Send a question or share a summary with your team.</p>
            )}
            <GameButton href="/care-team" variant="secondary" className="mt-4 w-full">
              Message care team
            </GameButton>
          </Panel>
          {data.game.rewards.length > 0 && (
            <Panel title="Recent rewards" action={<Star className="size-5 text-gold" aria-hidden />}>
              <ul className="flex flex-col gap-2">
                {data.game.rewards
                  .slice(-4)
                  .reverse()
                  .map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{r.title}</span>
                      <Tag tone="gold">+{r.xp} XP</Tag>
                    </li>
                  ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}

function QuestRow({ quest: q, onComplete, onUndo }: { quest: Quest; onComplete: () => void; onUndo: () => void }) {
  const Icon = ICONS[q.kind]
  const goesToPage = q.kind === 'symptom-check-in' || q.kind === 'mood-check-in' || q.kind === 'review-instructions'
  const undoable = q.done && (q.kind === 'activity' || q.kind === 'appointment')
  return (
    <li className={cn('flex flex-col gap-3 rounded-xl border-2 p-4 sm:flex-row sm:items-center', q.done ? 'border-success/40 bg-success-soft' : 'border-border bg-card')}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg border-2', q.done ? 'border-success bg-success text-primary-foreground' : 'border-navy bg-sky text-navy')}>
          {q.done ? <Check className="size-6" aria-hidden /> : <Icon className="size-6" aria-hidden />}
        </span>
        <div className="min-w-0">
          <p className={cn('text-lg font-bold', q.done && 'text-muted-foreground line-through decoration-2')}>
            {q.title}
            {q.dose && <span className="font-normal text-muted-foreground"> · {formatClock(q.dose.time)}</span>}
          </p>
          <p className="text-muted-foreground">{q.detail}</p>
          <p className="mt-1 text-sm text-muted-foreground">From: {q.source}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
        <Tag tone="gold">+{q.xp} XP</Tag>
        {q.done ? (
          undoable ? (
            <button type="button" onClick={onUndo} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-muted">
              <RotateCcw className="size-4" aria-hidden /> Undo
            </button>
          ) : (
            <span className="px-3 text-sm font-semibold text-success">Complete</span>
          )
        ) : goesToPage ? (
          <Link href={q.href} className="pixel-btn inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-4 font-semibold text-primary-foreground">
            Start <ArrowRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <button type="button" onClick={onComplete} className="pixel-btn inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-4 font-semibold text-primary-foreground">
            <Check className="size-4" aria-hidden /> {q.kind === 'medication' ? 'Mark taken' : 'Mark done'}
          </button>
        )}
      </div>
    </li>
  )
}
