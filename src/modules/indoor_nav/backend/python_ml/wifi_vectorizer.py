#!/usr/bin/env python3
import pandas as pd
import numpy as np
from typing import Dict, List
import json
import os

class WiFiVectorizer:
    def __init__(self, fingerprint_csv: str):
        if not os.path.exists(fingerprint_csv):
            raise FileNotFoundError(f"Fingerprint CSV missing: {fingerprint_csv}")

        df = pd.read_csv(fingerprint_csv)
        self.ap_columns = sorted([c for c in df.columns if c != "point"])
        self.dim = len(self.ap_columns)

    def vectorize_scan(self, scan: Dict[str, float]) -> np.ndarray:
        """
        scan format:
        {
            "bssid1": -55,
            "bssid2": -71,
            ...
        }
        """
        vec = []
        for ap in self.ap_columns:
            if ap in scan:
                vec.append(float(scan[ap]))
            else:
                vec.append(-100.0)
        return np.array(vec, dtype=np.float32)

    @staticmethod
    def load_scan_json(path: str) -> Dict[str, float]:
        with open(path, "r") as f:
            return json.load(f)

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: wifi_vectorizer.py <fingerprints.csv> <scan.json>")
        sys.exit(1)

    csv_path, scan_path = sys.argv[1], sys.argv[2]
    v = WiFiVectorizer(csv_path)
    scan = v.load_scan_json(scan_path)
    vec = v.vectorize_scan(scan)

    print("DIM:", v.dim)
    print("VECTOR SHAPE:", vec.shape)
    print("FIRST 20 VALUES:", vec[:20].tolist())
