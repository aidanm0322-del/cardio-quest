'use client'

import { useEffect, useRef, useState } from 'react'
import { SendHorizontal, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useGame, usePatient } from '@/components/app/game-provider'
import { DialogueBox, GameButton, Tag } from '@/components/app/game-ui'
import { PixelCharacter } from '@/components/character/pixel-character'
import { api } from '@/lib/client/api'
import { matchText } from '@/lib/escalation'
import { formatTimeOf } from '@/lib/dates'
import type { ChatTurn } from '@/lib/types'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'Why do I take metoprolol?',
  'What can I do on my walk today?',
  'When can I drive again?',
  "I'm feeling anxious about my recovery",
  'Explain my discharge instructions simply',
]

export function CompanionChat() {
  const data = usePatient().data!
  const { run, setView, showAlert } = useGame()
  const [input, setInput] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  const logRef = useRef<HTMLOListElement>(null)
  const name = data.character.name

  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView({ behavior: data.profile.settings.reduceMotion ? 'auto' : 'smooth', block: 'end' })
  }, [data.chat.length, pending, data.profile.settings.reduceMotion])

  async function send(text: string) {
    const message = text.trim()
    if (!message || pending) return
    setInput('')
    setPending(message)
    const urgent = matchText(message, data.rules)
    try {
      const res = await api.chat(message)
      setView(res.view)
      if (res.alert) showAlert(res.alert)
    } catch (e) {
      setInput(message)
      toast.error(urgent ? 'Message failed to send. If this is an emergency, call 911 now.' : e instanceof Error ? e.message : 'Message failed to send')
    } finally {
      setPending(null)
    }
  }

  const lastAssistant = [...data.chat].reverse().find((t) => t.role === 'assistant')
  const pose = pending ? 'think' : lastAssistant?.mode === 'urgent' ? 'idle' : 'talk'

  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[32rem] flex-col gap-4 lg:h-[calc(100dvh-6.5rem)]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-navy">Talk to {name}</h1>
          <p className="text-muted-foreground">Your companion answers using your care plan. {name} isn&apos;t a doctor and can&apos;t diagnose.</p>
        </div>
        {data.chat.length > 0 && (
          <GameButton variant="secondary" onClick={() => run({ type: 'chat.clear' }, { success: 'Conversation cleared' })} className="min-h-10 px-3">
            <Trash2 aria-hidden /> Clear
          </GameButton>
        )}
      </header>

      <div className="flex min-h-0 flex-1 gap-5">
        <div className="pixel-frame hidden w-56 shrink-0 flex-col items-center justify-end gap-3 bg-sky p-4 md:flex">
          <PixelCharacter appearance={data.character} pose={pose} size={180} label={`${name}, ${pending ? 'thinking' : 'listening'}`} />
          <p className="font-pixel text-xl text-navy">{name}</p>
        </div>

        <section aria-label="Conversation" className="pixel-frame flex min-w-0 flex-1 flex-col bg-card">
          <ol ref={logRef} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-5" aria-live="polite">
            {data.chat.length === 0 && !pending && (
              <li>
                <DialogueBox speaker={name}>
                  Hi {data.profile.preferredName}! Ask me about your medications, activity plan, or how you&apos;re feeling. If something feels urgent, call 911 right away.
                </DialogueBox>
              </li>
            )}
            {data.chat.map((t) => (
              <Turn key={t.id} turn={t} name={name} />
            ))}
            {pending && (
              <>
                <Turn turn={{ id: 'pending', role: 'user', content: pending, at: new Date().toISOString(), sources: [] }} name={name} />
                <li className="flex items-center gap-2 text-muted-foreground" aria-label={`${name} is thinking`}>
                  <span className="cq-dot" />
                  <span className="cq-dot [animation-delay:150ms]" />
                  <span className="cq-dot [animation-delay:300ms]" />
                </li>
              </>
            )}
          </ol>

          <div className="flex flex-col gap-3 border-t-2 border-border p-3 md:p-4">
            {data.chat.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="min-h-10 rounded-full border-2 border-border px-3 text-sm font-semibold hover:border-primary">
                    {s}
                  </button>
                ))}
              </div>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
            >
              <label htmlFor="chat-input" className="sr-only">
                Message {name}
              </label>
              <textarea
                id="chat-input"
                rows={1}
                value={input}
                maxLength={2000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return
                    e.preventDefault()
                    send(input)
                  }
                }}
                placeholder={`Ask ${name} anything…`}
                className="cq-input min-h-12 flex-1 resize-none"
              />
              <GameButton type="submit" disabled={!input.trim() || !!pending} className="shrink-0 px-4">
                <SendHorizontal aria-hidden />
                <span className="sr-only sm:not-sr-only">Send</span>
              </GameButton>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

function Turn({ turn, name }: { turn: ChatTurn; name: string }) {
  if (turn.role === 'user') {
    return (
      <li className="flex justify-end">
        <div className="max-w-[85%] rounded-xl rounded-br-sm bg-navy px-4 py-3 text-navy-foreground">
          <p className="whitespace-pre-wrap">{turn.content}</p>
          <p className="mt-1 text-right text-xs opacity-75">{formatTimeOf(turn.at)}</p>
        </div>
      </li>
    )
  }
  return (
    <li className="max-w-[92%]">
      <DialogueBox speaker={name} className={cn(turn.mode === 'urgent' && 'border-destructive bg-heart-soft')}>
        <p className="whitespace-pre-wrap">{turn.content}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {turn.mode === 'demo' && <Tag tone="demo">Demo reply</Tag>}
          {turn.mode === 'urgent' && <Tag tone="red">Safety guidance</Tag>}
          {turn.sources.length > 0 && <span>Based on: {turn.sources.join(', ')}</span>}
        </div>
      </DialogueBox>
    </li>
  )
}
