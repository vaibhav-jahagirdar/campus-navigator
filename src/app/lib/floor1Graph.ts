import { floor1Points, type FloorPoint } from "./floor1points"

export type Edge = {
  from: number
  to: number
  weight: number
}

const getPoint = (id: number): FloorPoint => {
  const p = floor1Points.find((p) => p.id === id)
  if (!p) throw new Error(`Point ${id} not found`)
  return p
}

const distance = (aId: number, bId: number): number => {
  const a = getPoint(aId)
  const b = getPoint(bId)
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Base adjacency graph for Floor 1.
 */
export const adjacency: Record<number, number[]> = {
  41: [1, 39],
  1:  [41, 2],
  2:  [1, 9, 3],
  3:  [2, 10, 5],
  5:  [3, 6],
  6:  [5, 7],
  7:  [6, 8],
  8:  [7],
  10: [3, 11],
  11: [10, 13],
  13: [11, 12],
  9:  [2, 12],
  12: [9, 14, 13],
  14: [12, 15],
  15: [14, 16, 17],
  17: [15, 23],
  16: [15, 19],
  19: [16, 20],
  20: [19, 21],
  21: [20, 22],
  22: [21, 23],
  23: [17, 22, 24],
  24: [23, 26],
  26: [24, 27],
  27: [26, 28],
  28: [27, 29],
  29: [28, 31, 30],
  31: [29, 32, 30, 34],    // Add direct connection 31→34
  32: [31, 33],
  33: [32],
  30: [29, 31, 35, 34],
  34: [30, 31],            // Add direct connection 34→31
  35: [30, 36],
  36: [35, 38, 37],
  37: [36],
  38: [36, 39],
  39: [38, 40, 41],
  40: [39],
}

// Only these nodes should be avoided when not destinations
const DETOUR_NODES = new Set([16, 20, 21, 22])

/**
 * Get adjacency graph with optional bypass around detour nodes.
 */
function getAdjacency(includeDetour: boolean): Record<number, number[]> {
  if (includeDetour) return adjacency
  
  // Create modified adjacency with bypass
  const modified: Record<number, number[]> = {}
  
  for (const [nodeStr, neighbors] of Object.entries(adjacency)) {
    const node = Number(nodeStr)
    
    // Skip nodes in the detour branches entirely
    if (DETOUR_NODES.has(node)) continue
    
    // Copy neighbors, filtering out detour nodes
    modified[node] = neighbors.filter(n => !DETOUR_NODES.has(n))
  }
  
  return modified
}

/**
 * Convert adjacency → weighted bidirectional edges.
 */
function buildWeightedEdges(adjacency: Record<number, number[]>): Edge[] {
  const edges: Edge[] = []
  const seen = new Set<string>()
  
  for (const a in adjacency) {
    const aId = Number(a)
    for (const bId of adjacency[aId]) {
      const key1 = `${aId}-${bId}`
      const key2 = `${bId}-${aId}`
      
      if (!seen.has(key1) && !seen.has(key2)) {
        const w = distance(aId, bId)
        edges.push({ from: aId, to: bId, weight: w })
        edges.push({ from: bId, to: aId, weight: w })
        seen.add(key1)
        seen.add(key2)
      }
    }
  }
  
  return edges
}

/**
 * Dijkstra shortest path with optional detour branches.
 */
export function shortestPathFloor1(startId: number, endId: number): number[] {
  // Include detour branches only if start or end is in them
  const needDetour = DETOUR_NODES.has(startId) || DETOUR_NODES.has(endId)
  const adj = getAdjacency(needDetour)
  const edges = buildWeightedEdges(adj)
  
  // Get valid node IDs
  const validIds = new Set<number>()
  for (const id in adj) {
    validIds.add(Number(id))
    adj[Number(id)].forEach(n => validIds.add(n))
  }
  const ids = Array.from(validIds)
  
  const dist = new Map<number, number>()
  const prev = new Map<number, number | null>()
  const visited = new Set<number>()
  
  for (const id of ids) {
    dist.set(id, id === startId ? 0 : Infinity)
    prev.set(id, null)
  }
  
  while (visited.size < ids.length) {
    let u: number | null = null
    let minDist = Infinity
    
    for (const id of ids) {
      if (visited.has(id)) continue
      const d = dist.get(id)!
      if (d < minDist) {
        minDist = d
        u = id
      }
    }
    
    if (u === null || minDist === Infinity) break
    if (u === endId) break
    
    visited.add(u)
    
    for (const e of edges.filter((e) => e.from === u)) {
      const alt = dist.get(u)! + e.weight
      if (alt < dist.get(e.to)!) {
        dist.set(e.to, alt)
        prev.set(e.to, u)
      }
    }
  }
  
  if (dist.get(endId) === Infinity) return []
  
  const path: number[] = []
  let u: number | null = endId
  while (u !== null) {
    path.unshift(u)
    u = prev.get(u)!
  }
  
  if (path[0] !== startId) return []
  return path
}