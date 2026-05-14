import { useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Crown, Star, BarChart3 } from 'lucide-react'
import { useGoals } from '@/stores/goalsStore'
import { AREA_LIST, AREA_PASSIVES } from '@/data/areas'
import { masteryForArea } from '@/engine/masteryEngine'
import { AREA_ICONS } from '@/components/icons'

/**
 * Skill Trees — one node per completed goal, milestone, or boss win. Five
 * nodes per mastery level. Per-area: header → 5×5 node canvas → mastery
 * passives at M3 and M5.
 */
export function Skills() {
  const goals = useGoals((s) => s.goals)

  const totals = useMemo(() => {
    let mastery = 0
    let nodes = 0
    for (const a of AREA_LIST) {
      const m = masteryForArea(a.id, goals)
      mastery += m.mastery
      nodes += m.nodes
    }
    return { mastery, nodes }
  }, [goals])

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Skill Trees</h1>
          <p className="text-sm text-muted mt-1">
            One node per completed goal, milestone, or boss win. Five nodes per mastery level.
          </p>
        </div>
        <div className="rounded-xl border border-border/10 bg-surface shadow-card px-4 py-2.5 inline-flex items-center gap-4">
          <Stat label="Mastery" value={`${totals.mastery}/30`} icon={Crown} />
          <Stat label="Nodes" value={totals.nodes} icon={BarChart3} />
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-3">
        {AREA_LIST.map((a) => {
          const m = masteryForArea(a.id, goals)
          const passive3 = AREA_PASSIVES[a.id].mastery3
          const passive5 = AREA_PASSIVES[a.id].mastery5
          const filled = m.nodes
          const Icon = AREA_ICONS[a.id]
          return (
            <div
              key={a.id}
              className="rounded-2xl bg-surface border border-border/10 shadow-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: `rgb(var(--${a.color}) / 0.15)`,
                      color: `rgb(var(--${a.color}))`,
                    }}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                  </span>
                  <div>
                    <div className="font-display text-lg">{a.name}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted">
                      mastery {m.mastery}/5 · {filled} nodes
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5"
                      strokeWidth={1.5}
                      fill={i < m.mastery ? 'currentColor' : 'none'}
                      style={{
                        color:
                          i < m.mastery
                            ? 'rgb(var(--accent2))'
                            : 'rgb(var(--muted) / 0.5)',
                      }}
                    />
                  ))}
                </div>
              </div>
              <SkillCanvas nodeCount={Math.min(25, filled)} colorVar={a.color} empty={filled === 0} />
              {filled === 0 && (
                <Link
                  to="/goals"
                  className="mt-3 block rounded-md border border-dashed border-border/40 bg-surface2/30 px-3 py-2 text-[11px] text-muted hover:text-text hover:border-accent/50 transition-colors"
                >
                  <span className="text-accent2">→</span> Complete a goal in {a.name.toLowerCase()} to earn your first node
                </Link>
              )}
              <div className="mt-3 space-y-1.5">
                <div className="text-[11px] text-muted flex items-center gap-1.5">
                  <span>At mastery 3:</span>
                  <Sparkles
                    className={`w-3 h-3 ${m.mastery >= 3 ? 'text-accent2' : 'text-muted/60'}`}
                    strokeWidth={1.8}
                  />
                  <span className={m.mastery >= 3 ? 'text-accent2' : ''}>{passive3.name}</span>
                </div>
                <div className="text-[11px] text-muted flex items-center gap-1.5">
                  <span>At mastery 5:</span>
                  <Crown
                    className={`w-3 h-3 ${m.mastery >= 5 ? 'text-legendary' : 'text-muted/60'}`}
                    strokeWidth={1.8}
                  />
                  <span className={m.mastery >= 5 ? 'text-legendary' : ''}>{passive5.name}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number | string
  icon: typeof Crown
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted flex items-center gap-1">
        <Icon className="w-3 h-3" strokeWidth={1.8} />
        {label}
      </div>
      <div className="font-display text-md leading-none tabular-nums">{value}</div>
    </div>
  )
}

function SkillCanvas({
  nodeCount,
  colorVar,
  empty,
}: {
  nodeCount: number
  colorVar: string
  empty?: boolean
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.clientWidth * dpr
    canvas.height = canvas.clientHeight * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    ctx.clearRect(0, 0, w, h)

    const cols = 5
    const rows = 5
    const padX = 24
    const padY = 18
    const cellW = (w - padX * 2) / (cols - 1)
    const cellH = (h - padY * 2) / (rows - 1)
    const nodes: { x: number; y: number; filled: boolean }[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c
        nodes.push({
          x: padX + c * cellW,
          y: padY + r * cellH,
          filled: idx < nodeCount,
        })
      }
    }

    const accent = `rgb(${getCSSVar(colorVar)})`
    ctx.lineWidth = 1
    ctx.strokeStyle = `${accent}33`
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c
        if (c < cols - 1) {
          drawLine(ctx, nodes[i], nodes[i + 1], nodes[i].filled && nodes[i + 1].filled, accent)
        }
        if (r < rows - 1) {
          drawLine(ctx, nodes[i], nodes[i + cols], nodes[i].filled && nodes[i + cols].filled, accent)
        }
      }
    }
    for (const n of nodes) {
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.filled ? 6 : 4, 0, Math.PI * 2)
      if (n.filled) {
        ctx.fillStyle = accent
        ctx.shadowColor = accent
        ctx.shadowBlur = 12
      } else {
        ctx.fillStyle = '#3a3a3a'
        ctx.shadowBlur = 0
      }
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }, [nodeCount, colorVar])

  return (
    <canvas
      ref={ref}
      className={`w-full h-32 rounded-lg bg-surface2/30 ${
        empty ? 'border border-dashed border-border/40' : 'border border-border/20'
      }`}
    />
  )
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  a: { x: number; y: number },
  b: { x: number; y: number },
  glow: boolean,
  color: string
) {
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.strokeStyle = glow ? color : `${color}22`
  ctx.lineWidth = glow ? 1.6 : 1
  ctx.stroke()
}

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim() || '184 148 84'
}
