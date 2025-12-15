#!/usr/bin/env python3
"""
Production-grade parser: raw -> normalized scan records.

Usage
  python3 src/01_parse_raw_floor2.py \
    --input ~/Desktop/indoor_wifi_project/wifi_raw/floor2/wifi_raw_f2.txt \
    --out-dir ~/Desktop/indoor_wifi_project/wifi_cleaned \
    --min-scans 7

Outputs (atomic):
  - <out-dir>/floor2_parsed_records.csv    (row per scan: point,BSSID,RSSI,timestamp,ssid)
  - <out-dir>/floor2_parsed_points.json   (points metadata normalized: P01..P28)
  - <out-dir>/floor2_parse_report.json    (summary + rejected lines)

Exit codes
  0  success
  2  input missing
  3  no points found
  4  strict mode failures (points with < min-scans)

Notes
  - Strict normalization rules: point ids normalized to P## (leading zero preserved)
  - Robust to header/metadata permutations and noisy lines seen in your files
  - Produces an actionable JSON report listing rejected lines and small diagnostics
"""

import argparse
import csv
import json
import logging
import re
import sys
from collections import defaultdict, Counter
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("parser")

# --- heuristics / regexes ---
POINT_LINE_RE = re.compile(r"(?:floor\s*[:]??\s*\d+[,\s]*)?point\s*[:\-\s]*([0-9]{1,3})", re.I)
POINT_SHORT_RE = re.compile(r"\bP\s*[:\-]?\s*([0-9]{1,3})\b", re.I)
META_INLINE_RE = re.compile(r"(?:tag|name)\s*[:\-]\s*([^,|]+)", re.I)
TS_RE = re.compile(r"(20\d{2}/\d{2}/\d{2}[- ]\d{2}:\d{2}:\d{2})")
MAC_RE = re.compile(r"([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})", re.I)
RSSI_RE = re.compile(r"(-?\d{1,3}(?:\.\d+)?)\s*d?Bm", re.I)
MIN_RSSI = -100.0

# canonicalize point id string

def normalize_point(raw_id: str) -> str:
    try:
        n = int(re.sub(r"[^0-9]", "", raw_id))
    except Exception:
        raise
    return f"P{n:02d}"


def safe_makedirs(p: Path):
    p.mkdir(parents=True, exist_ok=True)


# parse an entire messy raw file -> list of records + metadata + rejected lines
def parse_raw_file(path: Path):
    if not path.exists():
        logger.error("INPUT NOT FOUND: %s", path)
        sys.exit(2)

    records = []
    points_meta = {}
    rejected = []
    current_point = None

    with path.open("r", errors="ignore") as f:
        for lineno, raw in enumerate(f, start=1):
            line = raw.strip()
            if not line:
                continue

            # detect point header lines (many permutations exist)
            m = POINT_LINE_RE.search(line) or POINT_SHORT_RE.search(line)
            if m:
                pid = m.group(1)
                try:
                    current_point = normalize_point(pid)
                except Exception:
                    current_point = None
                # try to capture tag/title
                t = None
                tm = META_INLINE_RE.search(line)
                if tm:
                    t = tm.group(1).strip()
                # fallback heuristics: take a non-header fragment
                if not t:
                    parts = re.split(r"[,|]", line)
                    for part in parts:
                        s = part.strip()
                        if not s:
                            continue
                        low = s.lower()
                        if "point" in low or "time stamp" in low or "bssid" in low:
                            continue
                        t = s
                        break
                if current_point:
                    points_meta.setdefault(current_point, {})
                    if t:
                        points_meta[current_point]["tag"] = t
                    points_meta[current_point].setdefault("lineno", []).append(lineno)
                continue

            # skip obvious header rows repeated inside file
            if line.lower().startswith("time stamp") or ("bssid" in line.lower() and "strength" in line.lower()):
                continue

            # parse data rows: prefer '|' separated fields; fallback to comma-separated
            fields = line.split("|") if "|" in line else line.split(",")
            if len(fields) < 2:
                rejected.append({"lineno": lineno, "line": line, "reason": "not_enough_fields"})
                continue

            # timestamp detection
            ts = None
            m_ts = TS_RE.search(line)
            if m_ts:
                ts = m_ts.group(1)

            # extract mac & rssi (robust scanning across tokens)
            bssid = None
            rssi = None
            ssid = None

            for token in fields:
                tok = token.strip()
                if not tok:
                    continue
                # mac
                macm = MAC_RE.search(tok)
                if macm and not bssid:
                    bssid = macm.group(1).lower()
                # rssi
                rs = RSSI_RE.search(tok)
                if rs and rssi is None:
                    try:
                        rssi = float(rs.group(1))
                    except Exception:
                        pass
                # ssid heuristic: printable text with no ':' and not containing 'dBm' or numeric-heavy
                if ssid is None:
                    t = tok
                    if len(t) > 0 and ':' not in t and 'dBm' not in t and not MAC_RE.search(t):
                        # avoid pure timestamps
                        if not re.match(r"20\d{2}/\d{2}/\d{2}", t):
                            ssid = t

            # fallback positions: many files have columns: TimeStamp|SSID|BSSID|Strength|...
            if not bssid and len(fields) >= 3:
                cand = fields[2].strip()
                macm = MAC_RE.search(cand)
                if macm:
                    bssid = macm.group(1).lower()
            if rssi is None and len(fields) >= 4:
                cand = fields[3].strip()
                rs = re.search(r"(-?\d{1,3}(?:\.\d+)?)", cand)
                if rs:
                    rssi = float(rs.group(1))
            if ssid is None and len(fields) >= 2:
                cand = fields[1].strip()
                if cand and ':' not in cand and 'dBm' not in cand:
                    ssid = cand

            if not bssid:
                rejected.append({"lineno": lineno, "line": line, "reason": "no_bssid"})
                continue

            if rssi is None:
                rssi = MIN_RSSI

            # if current_point unknown, try to infer from the same line
            if not current_point:
                m2 = POINT_LINE_RE.search(line) or POINT_SHORT_RE.search(line)
                if m2:
                    try:
                        current_point = normalize_point(m2.group(1))
                    except Exception:
                        current_point = None

            if not current_point:
                # cannot place scan to a point -> reject
                rejected.append({"lineno": lineno, "line": line, "reason": "no_point_context"})
                continue

            records.append({"point": current_point, "bssid": bssid, "rssi": float(rssi), "timestamp": ts, "ssid": ssid})

    return records, points_meta, rejected


# safe atomic writer for CSV
def write_atomic(path: Path, rows, fieldnames):
    tmp = path.with_suffix(path.suffix + '.tmp')
    with tmp.open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
    tmp.replace(path)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--input', '-i', required=True)
    p.add_argument('--out-dir', '-o', required=True)
    p.add_argument('--min-scans', type=int, default=7)
    args = p.parse_args()

    inp = Path(args.input).expanduser()
    outdir = Path(args.out_dir).expanduser()
    safe_makedirs(outdir)

    records, meta, rejected = parse_raw_file(inp)

    if not records:
        logger.error('NO VALID RECORDS PARSED')
        sys.exit(3)

    # group by point
    by_point = defaultdict(list)
    for r in records:
        by_point[r['point']].append(r)

    # normalized points metadata
    points = {p: {'tag': meta.get(p, {}).get('tag', ''), 'count': len(by_point.get(p, []))} for p in sorted(by_point.keys())}

    report = {
        'input': str(inp),
        'parsed_rows': len(records),
        'unique_points': len(points),
        'points': points,
        'rejected_count': len(rejected),
        'rejections_sample': rejected[:200]
    }

    # strict min-scans enforcement
    bad_points = [p for p, c in ((p, len(v)) for p, v in by_point.items()) if c < args.min_scans]
    out_report = outdir / 'floor2_parse_report.json'
    if bad_points:
        report['bad_points'] = {p: len(by_point[p]) for p in bad_points}
        (out_report.with_suffix('.tmp')).write_text(json.dumps(report, indent=2))
        (out_report.with_suffix('.tmp')).replace(out_report)
        logger.error('STRICT MODE FAILURE: points with < %d scans: %s', args.min_scans, bad_points)
        logger.error('Report written to: %s', out_report)
        sys.exit(4)

    # write CSV of parsed records (one row per scan)
    out_csv = outdir / 'floor2_parsed_records.csv'
    fieldnames = ['point', 'bssid', 'rssi', 'timestamp', 'ssid']
    write_atomic(out_csv, records, fieldnames)

    # write points json normalized to P## order
    out_points = outdir / 'floor2_parsed_points.json'
    pts_out = {}
    for p in sorted(points.keys()):
        pts_out[p] = {'tag': points[p].get('tag', ''), 'count': points[p].get('count', 0)}
    tmp = out_points.with_suffix('.tmp')
    tmp.write_text(json.dumps({'points': pts_out}, indent=2))
    tmp.replace(out_points)

    # write final report
    (out_report.with_suffix('.tmp')).write_text(json.dumps(report, indent=2))
    (out_report.with_suffix('.tmp')).replace(out_report)

    logger.info('PARSE OK: rows=%d points=%d; csv=%s', len(records), len(points), out_csv)
    logger.info('Report=%s', out_report)
    sys.exit(0)


if __name__ == '__main__':
    main()

