import { floor4Points, FloorPoint } from "./floor4points";

export type Edge = {
  from: number;
  to: number;
  weight: number;
};

const getPoint = (id: number): FloorPoint => {
  const p = floor4Points.find((p) => p.id === id);
  if (!p) throw new Error(`Point ${id} not found`);
  return p;
};

const distance = (aId: number, bId: number): number => {
  const a = getPoint(aId);
  const b = getPoint(bId);
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Floor 4 graph.
 * Main corridor + side branches.
 */
const rawEdges: [number, number][] = [
  // --- Main corridor spine ---
  [1, 2],
  [2, 3],
  [3, 8],
  [8, 9],
  [9, 10],
  [10, 12],
  [12, 13],
  [13, 14],
  [14, 15],
  [15, 17],
  [17, 18],
  [18, 20],
  [20, 21],
  [21, 22],
  [22, 23],

  // --- Bottom-right branch ---
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],

  // --- Small branch near 10 ---
  [10, 11],

  // --- Middle-right branch (16 / 19) ---
  [14, 16],
  [16, 19],
  [19, 23], // reconnect
];

export const floor4Edges: Edge[] = rawEdges.flatMap(([a, b]) => {
  const w = distance(a, b);
  return [
    { from: a, to: b, weight: w },
    { from: b, to: a, weight: w },
  ];
});

/**
 * Dijkstra shortest path for Floor 4
 */
export function shortestPathFloor4(startId: number, endId: number): number[] {
  const ids = floor4Points.map((p) => p.id);
  const dist = new Map<number, number>();
  const prev = new Map<number, number | null>();
  const visited = new Set<number>();

  for (const id of ids) {
    dist.set(id, id === startId ? 0 : Infinity);
    prev.set(id, null);
  }

  while (visited.size < ids.length) {
    let u: number | null = null;
    let minDist = Infinity;

    for (const id of ids) {
      if (visited.has(id)) continue;
      const d = dist.get(id)!;
      if (d < minDist) {
        minDist = d;
        u = id;
      }
    }

    if (u === null || minDist === Infinity) break;
    if (u === endId) break;

    visited.add(u);

    for (const e of floor4Edges.filter((e) => e.from === u)) {
      const alt = dist.get(u)! + e.weight;
      if (alt < dist.get(e.to)!) {
        dist.set(e.to, alt);
        prev.set(e.to, u);
      }
    }
  }

  if (dist.get(endId) === Infinity) return [];

  const path: number[] = [];
  let u: number | null = endId;

  while (u !== null) {
    path.unshift(u);
    u = prev.get(u)!;
  }

  if (path[0] !== startId) return [];
  return path;
}
