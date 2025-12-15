import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

type Fingerprint = {
  point: number;
  aps: Record<string, number>;
};

// Cache to avoid repeated disk reads
const cache: Record<string, Fingerprint[]> = {};

// -----------------------------
// Alias: crucial for matching
// -----------------------------
function alias(bssid: string) {
  return bssid.toLowerCase().slice(0, 14); // xx:xx:xx:xx:xx family
}

// -----------------------------
// Load + normalize fingerprints
// -----------------------------
async function loadFingerprints(floor: string): Promise<Fingerprint[]> {
  if (cache[floor]) return cache[floor];

  const filePath = path.join(
    process.cwd(),
    "data",
    `floor${floor}_fingerprints_cleaned.json`
  );

  const raw = JSON.parse(await fs.readFile(filePath, "utf-8"));

  const fps: Fingerprint[] = [];

  for (const [pointKey, apsObj] of Object.entries(raw)) {
    const pointNum = Number(pointKey.replace(/p/i, ""));

    const normalized: Record<string, number> = {};
    for (const [bssid, rssi] of Object.entries(apsObj as any)) {
      const fam = alias(bssid);
      normalized[fam] = rssi as number;
    }

    fps.push({ point: pointNum, aps: normalized });
  }

  cache[floor] = fps;
  return fps;
}

// ----------------------------------------
// Distance with aliasing + weights
// ----------------------------------------
function computeDistance(
  fp: Record<string, number>,
  scan: Record<string, number>,
  floor: string
): number {
  let overlap = 0;
  let sum = 0;

  for (const [bssid, live] of Object.entries(scan)) {
    const fam = alias(bssid);
    const fpRssi = fp[fam];
    if (fpRssi === undefined) continue;

    overlap++;

    const diff = Math.abs(fpRssi - live);

    // Floor-specific weighting
    let weight = 1.0;
    if (floor === "1") {
      weight = fpRssi >= -70 ? 2.3 : fpRssi >= -80 ? 1.5 : 1.0;
    } else if (floor === "2") {
      weight = fpRssi >= -70 ? 1.3 : fpRssi >= -80 ? 1.1 : 1.0;
    }

    sum += diff * weight;
  }

  if (overlap === 0) return Infinity;

  // Missing AP penalty
  const missing = Object.keys(fp).length - overlap;

  if (floor === "1") {
    sum += missing * 1.3;
  } else if (floor === "2") {
    sum += missing * 0.6;     // much smaller penalty
  }

  // Low overlap floor-specific penalty
  if (overlap < 3) {
    if (floor === "1") sum += (3 - overlap) * 25;
    if (floor === "2") sum += (3 - overlap) * 8;  // much lighter
  }

  return sum / overlap;
}


// -----------------------
// KNN config
// -----------------------
const K = 4;
const MAX_DIST = 100;

// -----------------------------
// POST handler
// -----------------------------
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const floor = url.searchParams.get("floor");

    if (!floor)
      return NextResponse.json({ error: "Missing ?floor=" }, { status: 400 });

    const body = await req.json();

    if (!body.aps || typeof body.aps !== "object")
      return NextResponse.json(
        { error: "Expected { aps: { bssid: rssi } }" },
        { status: 400 }
      );

    // Normalize scan with aliasing
    const scan: Record<string, number> = {};
    for (const [b, r] of Object.entries(body.aps)) {
      const val = Number(r);
      if (!Number.isFinite(val)) continue;

      const fam = alias(b);

      // keep strongest if many radios map to same family
      if (!(fam in scan) || val > scan[fam]) {
        scan[fam] = val;
      }
    }

    const fingerprints = await loadFingerprints(floor);

    const distances = fingerprints.map((fp) => ({
      point: fp.point,
      dist: computeDistance(fp.aps, scan, floor)

    }));

    distances.sort((a, b) => a.dist - b.dist);

    const best = distances[0];

    if (!Number.isFinite(best.dist) || best.dist > MAX_DIST) {
      return NextResponse.json(
        { error: "No reliable match", closestDistance: best.dist },
        { status: 404 }
      );
    }

    // Weighted KNN
    const top = distances.slice(0, K);
    const scores: Record<number, number> = {};

    for (const item of top) {
      const weight = 1 / (item.dist + 1e-6);
      scores[item.point] = (scores[item.point] || 0) + weight;
    }

    let finalPoint = best.point;
    let bestScore = -1;

    for (const [pStr, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        finalPoint = Number(pStr);
      }
    }

    return NextResponse.json({
      estimatedPoint: finalPoint,
      confidence: bestScore,
      bestDistance: best.dist,
      neighbors: top,
      floor,
    });
  } catch (err) {
    console.error("Locate API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
