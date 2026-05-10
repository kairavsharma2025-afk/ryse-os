import type { Goal, AreaId } from '@/types'

// Each area: nodes = completed goals + boss-battle wins in that area.
// 5 nodes = mastery 1, 10 = mastery 2, 15 = mastery 3, 20 = mastery 4, 25 = mastery 5
export function masteryForArea(area: AreaId, goals: Goal[]): {
  mastery: number
  nodes: number
} {
  let nodes = 0
  for (const g of goals) {
    if (g.area !== area) continue
    if (g.completedAt) nodes++
    if (g.isBossBattle && g.bossBattleConfig?.defeated) nodes++
    // Each milestone counts as half a node
    nodes += Math.floor(g.milestones.filter((m) => m.completedAt).length / 2)
  }
  const mastery = Math.min(5, Math.floor(nodes / 5))
  return { mastery, nodes }
}
