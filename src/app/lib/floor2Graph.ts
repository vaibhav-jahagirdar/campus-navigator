import { floor2Points,FloorPoint } from "./floor2points";




export type Edge = {
  from: number;
  to: number;
  weight: number;
};

const getPoint = (id: number): FloorPoint => {
  const p = floor2Points.find((p) => p.id === id);
  if (!p) {
    throw new Error(`Point ${id} not found`);
  }
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
 * Edges model your verbal description with side branches only used when needed.
 */
const rawEdges: [number, number][] = [
  // --- Main corridor from entrance to dustbin ---

  [1, 2], // entrance ↔ 2f16
  [2, 6], // 2f16 ↔ fire extinguisher
  [6, 7], // extinguisher ↔ showcase
  [7, 8], // showcase ↔ water can
  [8, 9], // water can ↔ dustbin

  // --- Side passage to 2f17 classroom (dead-end) ---

  [2, 3], // 2f16 ↔ right side entrance point
  [3, 4], // right side entrance point ↔ near 2f17 passage
  [4, 5], // near 2f17 passage ↔ 2f17 classroom

  // --- Tail from dustbin to 2f15 and 2f14 (dead-end tail) ---

  [9, 10], // dustbin ↔ 2f15
  [10, 11], // 2f15 ↔ 2f14

  // --- Right corridor from dustbin towards offices, SC, dept, stairs ---

  [9, 12],  // dustbin ↔ right side entrance
  [12, 13], // right side entrance ↔ prof room 2f19
  [13, 29], // 2f19 ↔ 2f20

  // L-junction and SC cell:
  [29, 15], // 2f20 ↔ SC cell start (main corridor)
  [29, 14], // 2f20 ↔ L-junction (side)
  [14, 15], // L-junction ↔ SC cell start

  // SC cell → 2f23 → GRC → IEDC → dept → right turning → stairs up

  [15, 16], // SC cell start ↔ 2f21 / SC
  [16, 30], // 2f21 / SC ↔ 2f23
  [30, 17], // 2f23 ↔ GRC
  [17, 18], // GRC ↔ IEDC
  [18, 19], // IEDC ↔ Dept CSE & AIML
  [19, 20], // Dept ↔ right turning point
  [20, 21], // right turning point ↔ stairs to 3rd floor

  // --- Stairs down and lower 2nd floor ---

  [20, 22], // right turning point ↔ stairs to lower 2nd floor
  [22, 23], // stairs to lower 2nd ↔ end of stairs & entry lower 2nd

  // MAIN lower-2nd corridor: entry → junction → yoga / 2f07 / AI09
  [23, 27], // entry ↔ between seminar & staff (main)
  [27, 24], // junction ↔ near yoga/seminar hall
  [27, 28], // junction ↔ near class 2f07
  [28, 25], // near class 2f07 ↔ AI09 (2F07)

  // SIDE branch: staff room (only when 26 is start or end)
  [23, 26], // entry ↔ near staff room
];

export const floor2Edges: Edge[] = rawEdges.flatMap(([a, b]) => {
  const w = distance(a, b);
  return [
    { from: a, to: b, weight: w },
    { from: b, to: a, weight: w },
  ];
});

export function shortestPath(startId: number, endId: number): number[] {
  const ids = floor2Points.map((p) => p.id);
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

    for (const e of floor2Edges.filter((e) => e.from === u)) {
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