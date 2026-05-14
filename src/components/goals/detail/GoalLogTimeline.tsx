import { useMemo } from 'react'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { Activity } from 'lucide-react'
import { Empty } from '@/components/ui/Empty'
import type { Goal } from '@/types'

/**
 * Reverse-chronological log timeline (most recent first). Each row carries:
 *   • A vertical-rail dot that lights up on the same day as today
 *   • Date + relative-day label ("today" / "yesterday" / "N days ago")
 *   • Note (line-clamp 2) if present
 *   • XP awarded chip
 */
export function GoalLogTimeline({ goal }: { goal: Goal }) {
  const recent = useMemo(
    () =>
      [...goal.logs]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 20),
    [goal.logs]
  )

  if (recent.length === 0) {
    return (
      <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
        <Empty
          icon={Activity}
          title="No logs yet."
          body="The first log is the hardest. Then it's a chain."
        />
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted">Recent logs</div>
          <div className="font-display text-lg">
            {recent.length === goal.logs.length
              ? `${recent.length} total`
              : `${goal.logs.length} total · last ${recent.length}`}
          </div>
        </div>
        <div className="text-[11px] text-muted tabular-nums">
          +{goal.logs.reduce((s, l) => s + l.xpAwarded, 0)} XP earned
        </div>
      </div>

      <ul className="relative">
        <span
          aria-hidden
          className="absolute left-[7px] top-2 bottom-2 w-px bg-border/40"
        />
        {recent.map((log, i) => {
          const date = parseISO(log.date)
          const daysAgo = differenceInCalendarDays(new Date(), date)
          const rel =
            daysAgo === 0
              ? 'today'
              : daysAgo === 1
                ? 'yesterday'
                : daysAgo > 0
                  ? `${daysAgo}d ago`
                  : ''
          const isToday = daysAgo === 0
          return (
            <li key={log.id} className={`flex gap-3 relative ${i === recent.length - 1 ? '' : 'pb-3'}`}>
              <span
                aria-hidden
                className={`shrink-0 mt-1.5 w-[15px] h-[15px] rounded-full ring-2 ring-surface relative z-10 ${
                  isToday ? 'bg-accent shadow-glow' : 'bg-surface2 border-2 border-border/60'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs text-muted flex items-center gap-1.5">
                    <span className="tabular-nums">{format(date, 'EEE, MMM d')}</span>
                    {rel && (
                      <>
                        <span className="text-muted/40">·</span>
                        <span className={isToday ? 'text-accent' : 'text-muted/80'}>{rel}</span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] tabular-nums text-accent2 shrink-0">
                    {log.xpAwarded > 0 ? `+${log.xpAwarded} XP` : '· no XP'}
                  </div>
                </div>
                {log.note && (
                  <div className="text-sm text-text/85 mt-0.5 leading-snug line-clamp-2">
                    {log.note}
                  </div>
                )}
                {log.amount !== undefined && (
                  <div className="text-[11px] text-muted mt-0.5">
                    Amount: <span className="tabular-nums">{log.amount}</span>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
