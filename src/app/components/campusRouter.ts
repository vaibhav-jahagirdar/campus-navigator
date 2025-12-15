// Minimal campus graph builder (Micro Step 4a)
// Next steps will import this, add state, then load campus-paths.geojson.
// Keep this file focused and small.

export interface CampusGraph {
  nodes: NodeRecord[];
  adjacency: Map<number, Edge[]>;
}

export interface NodeRecord {
  id: number;
  coord: [number, number]; // [lon, lat]
}

export interface Edge {
  to: number;
  weight: number; // meters
}

// Haversine distance (meters)
export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Build an undirected weighted graph from LineString / MultiLineString features.
export function buildGraph(pathsGeojson: any): CampusGraph {
  const coordIndex = new Map<string, number>();
  const nodes: NodeRecord[] = [];
  const adjacency = new Map<number, Edge[]>();

  function addNode(coord: [number, number]): number {
    const key = coord.join(',');
    if (coordIndex.has(key)) return coordIndex.get(key)!;
    const id = nodes.length;
    nodes.push({ id, coord });
    coordIndex.set(key, id);
    return id;
  }

  function connect(a: number, b: number, dist: number) {
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a)!.push({ to: b, weight: dist });
    adjacency.get(b)!.push({ to: a, weight: dist });
  }

  const feats = pathsGeojson?.features || [];
  for (const f of feats) {
    if (!f.geometry) continue;
    if (f.geometry.type === 'LineString') {
      const coords = f.geometry.coordinates as [number, number][];
      for (let i = 0; i < coords.length - 1; i++) {
        const a = addNode(coords[i]);
        const b = addNode(coords[i + 1]);
        const d = haversineM(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]);
        connect(a, b, d);
      }
    } else if (f.geometry.type === 'MultiLineString') {
      for (const part of f.geometry.coordinates as [number, number][][]) {
        for (let i = 0; i < part.length - 1; i++) {
          const a = addNode(part[i]);
          const b = addNode(part[i + 1]);
          const d = haversineM(part[i][1], part[i][0], part[i + 1][1], part[i + 1][0]);
          connect(a, b, d);
        }
      }
    }
  }

  return { nodes, adjacency };
}
// Find nearest node to lon/lat (returns node id and distance meters)
export function findNearestNode(graph: CampusGraph, lon: number, lat: number): { id: number; dist: number } | null {
  if (!graph.nodes.length) return null;
  let best = -1;
  let bestD = Infinity;
  for (const n of graph.nodes) {
    const d = haversineM(lat, lon, n.coord[1], n.coord[0]);
    if (d < bestD) {
      bestD = d;
      best = n.id;
    }
  }
  return best >= 0 ? { id: best, dist: bestD } : null;
}

// A* shortest path (returns array of node ids + total distance)
export function shortestPath(graph: CampusGraph, startNode: number, endNode: number): { path: number[]; distance: number } | null {
  if (startNode === endNode) return { path: [startNode], distance: 0 };
  type OpenSetEntry = { id: number; f: number; g: number };
  const open = new MinHeap<OpenSetEntry>((a, b) => a.f - b.f);
  const gScore = new Map<number, number>();
  const fScore = new Map<number, number>();
  const cameFrom = new Map<number, number>();
  gScore.set(startNode, 0);

  function heuristic(a: number, b: number) {
    const A = graph.nodes[a].coord;
    const B = graph.nodes[b].coord;
    return haversineM(A[1], A[0], B[1], B[0]);
  }

  const startF = heuristic(startNode, endNode);
  fScore.set(startNode, startF);
  open.push({ id: startNode, g: 0, f: startF });

  while (!open.isEmpty()) {
    const current = open.pop()!;
    if (current.id === endNode) {
      // Reconstruct
      const path: number[] = [];
      let cur = endNode;
      while (cur !== undefined) {
        path.push(cur);
        cur = cameFrom.get(cur)!;
        if (cur === undefined) break;
      }
      path.reverse();
      return { path, distance: gScore.get(endNode)! };
    }

    const neighbors = graph.adjacency.get(current.id) || [];
    for (const e of neighbors) {
      const tentative = gScore.get(current.id)! + e.weight;
      const prevBest = gScore.get(e.to);
      if (prevBest === undefined || tentative < prevBest) {
        cameFrom.set(e.to, current.id);
        gScore.set(e.to, tentative);
        const f = tentative + heuristic(e.to, endNode);
        fScore.set(e.to, f);
        open.push({ id: e.to, g: tentative, f });
      }
    }
  }
  return null;
}

// Minimal binary heap (private)
class MinHeap<T> {
  private data: T[] = [];
  constructor(private cmp: (a: T, b: T) => number) {}
  push(x: T) { this.data.push(x); this.bubbleUp(this.data.length - 1); }
  pop(): T | null {
    if (!this.data.length) return null;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }
  isEmpty() { return this.data.length === 0; }
  private bubbleUp(i: number) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.cmp(this.data[i], this.data[p]) >= 0) break;
      [this.data[i], this.data[p]] = [this.data[p], this.data[i]];
      i = p;
    }
  }
  private bubbleDown(i: number) {
    const n = this.data.length;
    while (true) {
      let l = i * 2 + 1, r = l + 1, smallest = i;
      if (l < n && this.cmp(this.data[l], this.data[smallest]) < 0) smallest = l;
      if (r < n && this.cmp(this.data[r], this.data[smallest]) < 0) smallest = r;
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
      i = smallest;
    }
  }
}