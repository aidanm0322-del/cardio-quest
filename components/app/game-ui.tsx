'use client'

import Link from 'next/link'
import { Loader2, Phone, Siren, Star } from 'lucide-react'
import type { LevelInfo } from '@/lib/types'
import { cn } from '@/lib/utils'

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1">
        {eyebrow && <p className="font-pixel text-sm tracking-wider text-primary uppercase">{eyebrow}</p>}
        <h1 className="text-3xl font-bold text-balance text-navy md:text-4xl">{title}</h1>
        {description && <p className="max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  )
}

export function Panel({ title, action, children, className, id }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn('flex flex-col gap-4 rounded-xl border-2 border-border bg-card p-5', className)} aria-labelledby={title && id ? `${id}-title` : undefined}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3">
          {title && (
            <h2 id={id ? `${id}-title` : undefined} className="text-xl font-bold text-navy">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function DialogueBox({ speaker, children, className, tail = 'left' }: { speaker?: string; children: React.ReactNode; className?: string; tail?: 'left' | 'bottom' | 'none' }) {
  return (
    <div className={cn('pixel-frame relative bg-card px-5 py-4', className)}>
      {speaker && <p className="mb-1 font-pixel text-sm tracking-wide text-primary">{speaker}</p>}
      <div className="text-lg leading-relaxed text-pretty">{children}</div>
      {tail === 'left' && <span aria-hidden className="absolute top-8 -left-[11px] size-4 rotate-45 border-b-[3px] border-l-[3px] border-navy bg-card" />}
      {tail === 'bottom' && <span aria-hidden className="absolute -bottom-[11px] left-10 size-4 rotate-45 border-r-[3px] border-b-[3px] border-navy bg-card" />}
    </div>
  )
}

export function XpBar({ level, compact }: { level: LevelInfo; compact?: boolean }) {
  const pct = Math.min(100, Math.round((level.xpIntoLevel / level.xpForLevel) * 100))
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 font-semibold">
          <Star className="size-4 fill-gold text-gold-foreground" aria-hidden />
          Lv {level.level} · {level.title}
        </span>
        {!compact && (
          <span className="text-muted-foreground">
            {level.xpIntoLevel}/{level.xpForLevel} XP
          </span>
        )}
      </div>
      <div className="h-3 w-full overflow-hidden rounded-sm border-2 border-navy bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="XP toward next level">
        <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function GameButton({
  href,
  onClick,
  children,
  variant = 'primary',
  className,
  type = 'button',
  disabled,
}: {
  href?: string
  onClick?: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'gold' | 'danger'
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const cls = cn(
    'pixel-btn inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-base font-semibold disabled:opacity-50 [&_svg]:size-5',
    variant === 'primary' && 'bg-primary text-primary-foreground',
    variant === 'secondary' && 'bg-card text-navy',
    variant === 'gold' && 'bg-gold text-navy',
    variant === 'danger' && 'bg-destructive text-destructive-foreground',
    className,
  )
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  return (
    <button type={type} onClick={onClick} className={cls} disabled={disabled}>
      {children}
    </button>
  )
}

export function EmergencyButton({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/emergency"
      className={cn('inline-flex min-h-11 items-center gap-2 rounded-lg bg-destructive px-3.5 font-bold text-destructive-foreground hover:bg-destructive/90', className)}
    >
      <Siren className="size-5" aria-hidden />
      <span className={compact ? 'sr-only sm:not-sr-only' : undefined}>Emergency help</span>
    </Link>
  )
}

export function CallLink({ phone, label }: { phone: string; label: string }) {
  return (
    <a href={`tel:${phone}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border-2 border-border px-3 font-semibold hover:bg-muted">
      <Phone className="size-4" aria-hidden /> {label}
    </a>
  )
}

export function LoadingState({ label = 'Loading your quest…' }: { label?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground" role="status">
      <Loader2 className="size-6 animate-spin" aria-hidden />
      <span className="text-lg">{label}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-destructive/30 bg-heart-soft p-6 text-center" role="alert">
      <p className="text-lg font-semibold">{message}</p>
      {onRetry && (
        <GameButton variant="secondary" onClick={onRetry}>
          Try again
        </GameButton>
      )}
    </div>
  )
}

export function Tag({ children, tone = 'neutral', className }: { children: React.ReactNode; tone?: 'neutral' | 'blue' | 'gold' | 'red' | 'green' | 'demo'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold',
        tone === 'neutral' && 'bg-muted text-muted-foreground',
        tone === 'blue' && 'bg-accent text-accent-foreground',
        tone === 'gold' && 'bg-gold-soft text-gold-foreground',
        tone === 'red' && 'bg-heart-soft text-destructive',
        tone === 'green' && 'bg-success-soft text-success',
        tone === 'demo' && 'border border-dashed border-muted-foreground/60 bg-card text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Choice({
  selected,
  onClick,
  children,
  className,
  role = 'radio',
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
  role?: 'radio' | 'checkbox'
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'flex min-h-14 items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-base font-medium transition-colors',
        selected ? 'border-primary bg-accent text-accent-foreground' : 'border-border bg-card hover:border-primary/50',
        className,
      )}
    >
      {children}
    </button>
  )
}
