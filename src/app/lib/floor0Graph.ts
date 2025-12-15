// floor0Graph.ts — Correct graph for Floor 0

import { floor0Points, type FloorPoint } from "./floor0Points";

export type Edge = { from: number; to: number; weight: number };

// -------------------------
// CORRIDOR (MAIN SPINE)
// -------------------------
export const MAIN_SPINE: number[] = [
  1,2,3,4,5,6,7,9,10,11,12,13,14,15,
  16,17,18,19,20,
  24,25,26,27,32,33,34,35,36,37,38,39,40,41,42
];

// -------------------------
// BRANCHES (Conditional)
// -------------------------
export const BRANCHES: number[][] = [
  // Machine lab branch (only if dest ≥ 22)
  [20,21,22,23],

  // EEE / HV Lab branch (only if dest ≥ 28)
  [27,28,29,30,31]
];

// -------------------------
// DETOUR NODES
// -------------------------
export const DETOUR_NODES = new Set<number>([
  // machine lab branch
  21,22,23,

  // EEE / HV branch
  28,29,30,31
]);

// -------------------------
// Utilities
// -------------------------
const getPoint = (id: number): FloorPoint => {
  const p = floor0Points.find(p => p.id === id);
  if (!p) throw new Error(`Point ${id} missing in floor0Points`);
  return p;
};

const dist = (a: number, b: number) => {
  const A = getPoint(a);
  const B = getPoint(b);
  return Math.sqrt((A.x - B.x)**2 + (A.y - B.y)**2);
};

// -------------------------
// Build adjacency
// -------------------------
function buildBaseAdjacency(): Record<number, number[]> {
  const map: Record<number, Set<number>> = {};

  const ensure = (id: number) => {
    if (!map[id]) map[id] = new Set<number>();
  };

  // Main spine
  for (let i = 0; i < MAIN_SPINE.length - 1; i++) {
    const a = MAIN_SPINE[i];
    const b = MAIN_SPINE[i + 1];
    ensure(a); ensure(b);
    map[a].add(b);
    map[b].add(a);
  }

  // Branches
  for (const branch of BRANCHES) {
    for (let i = 0; i < branch.length - 1; i++) {
      const a = branch[i];
      const b = branch[i + 1];
      ensure(a); ensure(b);
      map[a].add(b);
      map[b].add(a);
    }
  }

  // Convert sets → arrays
  const out: Record<number, number[]> = {};
  for (const k of Object.keys(map)) {
    out[Number(k)] = Array.from(map[Number(k)]);
  }
  return out;
}

// -------------------------
// Hide detours unless required
// -------------------------
export function getAdjacency(include: boolean): Record<number, number[]> {
  const base = buildBaseAdjacency();
  if (include) return base;

  const filtered: Record<number, number[]> = {};
  for (const [idStr, neigh] of Object.entries(base)) {
    const id = Number(idStr);
    if (DETOUR_NODES.has(id)) continue;
    filtered[id] = neigh.filter(n => !DETOUR_NODES.has(n));
  }
  return filtered;
}

// -------------------------
// Weighted edges
// -------------------------
function buildEdges(adj: Record<number, number[]>): Edge[] {
  const edges: Edge[] = [];
  const seen = new Set<string>();

  for (const aStr of Object.keys(adj)) {
    const a = Number(aStr);
    for (const b of adj[a]) {
      const k1 = `${a}-${b}`;
      const k2 = `${b}-${a}`;
      if (seen.has(k1) || seen.has(k2)) continue;
      const w = dist(a,b);
      edges.push({ from: a, to: b, weight: w });
      edges.push({ from: b, to: a, weight: w });
      seen.add(k1); seen.add(k2);
    }
  }

  return edges;
}

// -------------------------
// Dijkstra shortest path
// -------------------------
export function shortestPathFloor0(start: number, end: number): number[] {
  const needDetours =
    DETOUR_NODES.has(start) ||
    DETOUR_NODES.has(end) ||
    end >= 21; // auto include machine lab / EEE branch when needed

  const adj = getAdjacency(needDetours);
  const edges = buildEdges(adj);

  const nodes = new Set<number>();
  for (const [k, neigh] of Object.entries(adj)) {
    const id = Number(k);
    nodes.add(id);
    neigh.forEach(n => nodes.add(n));
  }

  if (!nodes.has(start) || !nodes.has(end)) return [];

  const distMap = new Map<number, number>();
  const prev = new Map<number, number | null>();
  const visited = new Set<number>();

  nodes.forEach(id => {
    distMap.set(id, id === start ? 0 : Infinity);
    prev.set(id, null);
  });

  const list = Array.from(nodes);

  while (visited.size < list.length) {
    let u: number | null = null;
    let best = Infinity;

    for (const id of list) {
      if (visited.has(id)) continue;
      const d = distMap.get(id)!;
      if (d < best) {
        best = d;
        u = id;
      }
    }

    if (u === null || best === Infinity) break;
    if (u === end) break;

    visited.add(u);

    for (const e of edges.filter(e => e.from === u)) {
      const alt = distMap.get(u)! + e.weight;
      if (alt < (distMap.get(e.to) ?? Infinity)) {
        distMap.set(e.to, alt);
        prev.set(e.to, u);
      }
    }
  }

  if ((distMap.get(end) ?? Infinity) === Infinity) return [];

  const path: number[] = [];
  let cur: number | null = end;

  while (cur !== null) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }

  return path[0] === start ? path : [];
}
