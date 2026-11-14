import { z } from 'zod'
import { matchText } from '@/lib/escalation'
import { companionReply, summarizeThread } from '@/lib/server/companion'
import { handle } from '@/lib/server/http'
import { describeAlertForChat, patientView, requireRole } from '@/lib/server/service'
import { mutateState, readState } from '@/lib/server/store'
import type { Alert, ChatTurn } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const body = z.discriminatedUnion('task', [
  z.object({ task: z.literal('chat'), message: z.string().trim().min(1).max(2000) }),
  z.object({ task: z.literal('summarize-thread') }),
])

const uid = () => `turn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export function POST(req: Request) {
  return handle(async () => {
    await requireRole('patient')
    const input = body.parse(await req.json())

    if (input.task === 'summarize-thread') return summarizeThread(await readState())

    const userTurn: ChatTurn = { id: uid(), role: 'user', content: input.message, at: new Date().toISOString(), sources: [] }

    // Safety rules run before (and instead of) the model for urgent content.
    const urgent = matchText(input.message)
    if (urgent) {
      const { state, result } = await mutateState((s) => {
        const alert: Alert = {
          id: `alert-${Date.now().toString(36)}`,
          at: new Date().toISOString(),
          ruleId: urgent.rule.id,
          severity: urgent.rule.severity,
          trigger: urgent.trigger,
          detail: urgent.rule.condition,
          action: urgent.rule.action,
          source: 'chat',
          simulated: false,
          acknowledged: false,
        }
        s.alerts.unshift(alert)
        s.chat.push(userTurn, {
          id: uid(),
          role: 'assistant',
          content: describeAlertForChat(alert),
          at: new Date().toISOString(),
          sources: ['Care-plan safety rules'],
          mode: 'urgent',
        })
        return alert
      })
      return { view: patientView(state), alert: result }
    }

    const snapshot = await readState()
    const reply = await companionReply(snapshot, [...snapshot.chat, userTurn])
    const { state } = await mutateState((s) => {
      s.chat.push(userTurn, { id: uid(), role: 'assistant', at: new Date().toISOString(), ...reply })
    })
    return { view: patientView(state) }
  })
}
