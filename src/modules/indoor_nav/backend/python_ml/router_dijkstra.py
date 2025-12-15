#!/usr/bin/env python3
from typing import List, Dict, Tuple
from graph_loader import Graph, load_graph

class Router:
    def __init__(self, graph: Graph):
        self.graph = graph

    def shortest_path(self, src: str, dst: str) -> Dict:
        if src not in self.graph.nodes:
            raise ValueError(f"Invalid src node: {src}")
        if dst not in self.graph.nodes:
            raise ValueError(f"Invalid dst node: {dst}")

        path = self.graph.dijkstra(src, dst)
        if not path:
            return {"ok": False, "path": None, "distance": None}

        # compute geometric distance
        total_dist = 0.0
        for a, b in zip(path, path[1:]):
            total_dist += self.graph.distance(a, b)

        return {
            "ok": True,
            "path": path,
            "distance": total_dist
        }

def load_and_route(graph_path: str, src: str, dst: str):
    g = load_graph(graph_path)
    router = Router(g)
    return router.shortest_path(src, dst)

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 4:
        print("Usage: router_dijkstra.py <graph.json> <SRC> <DST>")
        sys.exit(1)

    graph_path, src, dst = sys.argv[1], sys.argv[2], sys.argv[3]
    out = load_and_route(graph_path, src, dst)
    print(out)
