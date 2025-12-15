#!/usr/bin/env python3
import json, math, sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Set, Tuple, List, Optional

@dataclass(frozen=True)
class Node:
    id: str
    x: float
    y: float
    tag: str = ""
    type: str = ""

class Graph:
    def __init__(self, nodes: Dict[str, Node], edges: List[Tuple[str,str]], metadata=None):
        self.nodes = nodes
        self.metadata = metadata or {}
        self.adj = {nid: set() for nid in nodes}

        for a,b in edges:
            if a not in nodes or b not in nodes:
                raise ValueError(f"Edge references missing node: {(a,b)}")
            self.adj[a].add(b)
            self.adj[b].add(a)

    def coord(self, nid: str):
        n = self.nodes[nid]
        return (n.x, n.y)

    @staticmethod
    def euclid(a,b):
        return math.hypot(a[0]-b[0], a[1]-b[1])

    def distance(self, a,b):
        return Graph.euclid(self.coord(a), self.coord(b))

    def dijkstra(self, src, dst):
        import heapq
        dist = {n: math.inf for n in self.nodes}
        prev = {n: None for n in self.nodes}
        dist[src] = 0
        pq = [(0, src)]

        while pq:
            d,u = heapq.heappop(pq)
            if d > dist[u]: continue
            if u == dst: break
            for v in self.adj[u]:
                nd = d + self.distance(u,v)
                if nd < dist[v]:
                    dist[v] = nd
                    prev[v] = u
                    heapq.heappush(pq,(nd,v))

        if dist[dst] == math.inf:
            return None

        path=[]
        cur=dst
        while cur:
            path.append(cur)
            cur=prev[cur]
        return list(reversed(path))

    def report(self):
        comps=[]
        visited=set()
        for nid in self.nodes:
            if nid in visited: continue
            stack=[nid]; comp=set()
            while stack:
                u=stack.pop()
                if u in visited: continue
                visited.add(u); comp.add(u)
                for v in self.adj[u]:
                    if v not in visited: stack.append(v)
            comps.append(comp)

        return {
            "nodes": len(self.nodes),
            "edges": sum(len(v) for v in self.adj.values())//2,
            "components": len(comps),
            "largest_component": max(len(c) for c in comps),
        }

def load_graph(path):
    p = Path(path).expanduser()
    with p.open() as f:
        obj = json.load(f)

    nodes_raw = obj["nodes"]
    edges_raw = obj["edges"]

    nodes={}
    for nid,props in nodes_raw.items():
        nodes[nid] = Node(
            id=nid,
            x=float(props["x"]),
            y=float(props["y"]),
            tag=props.get("tag",""),
            type=props.get("type",""),
        )

    edges=[(a,b) for a,b in edges_raw]

    return Graph(nodes, edges, obj.get("metadata"))

if __name__ == "__main__":
    if len(sys.argv)!=2:
        print("Usage: graph_loader.py <path>")
        sys.exit(1)

    g=load_graph(sys.argv[1])
    rep=g.report()
    print("NODES:", rep["nodes"])
    print("EDGES:", rep["edges"])
    print("COMPONENTS:", rep["components"])
    print("LARGEST:", rep["largest_component"])
