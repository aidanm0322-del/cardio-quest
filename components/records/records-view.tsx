'use client'

import { Check, Send } from 'lucide-react'
import { useGame, usePatient } from '@/components/app/game-provider'
import { GameButton, PageHeader, Panel, Tag } from '@/components/app/game-ui'
import { formatDate } from '@/lib/dates'

const TYPE_LABEL = { discharge: 'Discharge', visit: 'Visit note', lab: 'Lab results', plan: 'Care plan' } as const

export function RecordsView() {
  const data = usePatient().data!
  const { run } = useGame()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Records" description="Your documents with a plain-language summary first. The original text is always one tap away." />
      <div className="flex flex-col gap-6">
        {[...data.records]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((r) => (
            <Panel
              key={r.id}
              title={r.title}
              action={
                <div className="flex flex-wrap gap-2">
                  <Tag tone="blue">{TYPE_LABEL[r.type]}</Tag>
                  {r.reviewedAt && <Tag tone="green">Reviewed</Tag>}
                </div>
              }
            >
              <p className="mb-3 text-muted-foreground">
                {formatDate(r.date, 'long')} · {r.source}
              </p>
              <h3 className="font-bold">In plain language</h3>
              <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-6">
                {r.summary.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              <details className="mt-4 rounded-lg border-2 border-border p-3">
                <summary className="min-h-8 cursor-pointer font-semibold">Show original document</summary>
                <pre className="mt-3 font-sans text-sm whitespace-pre-wrap">{r.original}</pre>
              </details>
              <p className="mt-3 text-sm text-muted-foreground">Summaries help you understand your records; they don&apos;t replace your care team&apos;s advice.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {!r.reviewedAt && (
                  <GameButton variant="gold" onClick={() => run({ type: 'record.review', recordId: r.id })}>
                    <Check aria-hidden /> I&apos;ve read this
                  </GameButton>
                )}
                <GameButton
                  variant="secondary"
                  onClick={() =>
                    run(
                      { type: 'message.send', body: `I have a question about "${r.title}".`, attachments: [{ kind: 'record', label: r.title, lines: r.summary.slice(0, 20) }] },
                      { success: 'Sent to your care team' },
                    )
                  }
                >
                  <Send aria-hidden /> Ask my team about this
                </GameButton>
              </div>
            </Panel>
          ))}
      </div>
    </div>
  )
}
