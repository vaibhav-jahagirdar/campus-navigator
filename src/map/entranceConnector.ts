import type maplibregl from 'maplibre-gl';
import type { Feature, FeatureCollection, LineString } from 'geojson';

interface Entrance { id: string; coord: [number, number]; [k: string]: any }
interface EntrancesFile { entrances: Entrance[] }

export async function addOrUpdateEntranceConnectors(
  map: maplibregl.Map,
  opts: { minMeters?: number; url?: string } = {}
) {
  const minMeters = opts.minMeters ?? 8;
  const url = opts.url ?? '/data/entrances.json';

  if (!map.getSource('campus-buildings')) {
    console.warn('[Connectors] campus-buildings source not ready.');
    return;
  }

  let entrancesData: EntrancesFile | null = null;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    entrancesData = await res.json();
  } catch (e) {
    console.warn('[Connectors] Failed to load entrances:', e);
    return;
  }
  if (!entrancesData || !Array.isArray(entrancesData.entrances)) {
    console.warn('[Connectors] Invalid entrances format.');
    return;
  }

  const mapById = new Map<string, [number, number]>();
  for (const e of entrancesData.entrances) {
    if (e?.id && Array.isArray(e.coord) && e.coord.length >= 2) {
      mapById.set(String(e.id), [e.coord[0], e.coord[1]]);
    }
  }

  // Access current buildings GeoJSON (MapLibre internal reference)
  const src: any = map.getSource('campus-buildings');
  if (!src || !src._data) {
    console.warn('[Connectors] campus-buildings data not present yet.');
    return;
  }
  const buildings = src._data;
  const features: any[] = buildings.features || [];
  const connectorFeatures: Feature<LineString, { id: string; lengthM: number }>[] = [];
  for (const f of features) {
    const props = f.properties || {};
    const bid = props.id;
    if (!bid) continue;
    const ent = mapById.get(String(bid));
    if (!ent) continue;

    const c = centroid(f);
    const dist = planarApproxMeters(c, ent);
    if (dist < minMeters) continue;

    connectorFeatures.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [c, ent] },
      properties: { id: bid, lengthM: dist }
    } as Feature<LineString, { id: string; lengthM: number }>);
  }

  const fc: FeatureCollection<LineString, { id: string; lengthM: number }> = {
    type: 'FeatureCollection',
    features: connectorFeatures
  };

  if (!map.getSource('campus-entrance-connectors')) {
    map.addSource('campus-entrance-connectors', { type: 'geojson', data: fc });
    map.addLayer({
      id: 'campus-entrance-connectors',
      type: 'line',
      source: 'campus-entrance-connectors',
      paint: {
        'line-color': '#cbd5e1',
        'line-width': 1.5,
        'line-opacity': 0.85,
        'line-dasharray': [2, 2]
      }
    }, 'campus-buildings-label');
    console.log('[Connectors] Layer added. Count:', connectorFeatures.length);
  } else {
    (map.getSource('campus-entrance-connectors') as maplibregl.GeoJSONSource).setData(fc);
    console.log('[Connectors] Layer updated. Count:', connectorFeatures.length);
  }
}

function centroid(f: any): [number, number] {
  const g = f.geometry;
  if (!g) return [0, 0];
  if (g.type === 'Point') {
    const [px, py] = g.coordinates;
    return [px, py];
  }
  const rings: number[][][] = [];
  if (g.type === 'Polygon') rings.push(g.coordinates[0]);
  else if (g.type === 'MultiPolygon') for (const poly of g.coordinates) rings.push(poly[0]);
  else return [0, 0];
  let area = 0, cx = 0, cy = 0;
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[i + 1];
      const a = x1 * y2 - x2 * y1;
      area += a;
      cx += (x1 + x2) * a;
      cy += (y1 + y2) * a;
    }
  }
  area *= 0.5;
  if (area === 0) {
    const [x, y] = rings[0][0];
    return [x, y];
  }
  return [cx / (6 * area), cy / (6 * area)];
}

function planarApproxMeters(a: [number, number], b: [number, number]): number {
  const latScale = 111320;
  const meanLatRad = ((a[1] + b[1]) / 2) * Math.PI / 180;
  const lonScale = Math.cos(meanLatRad) * latScale;
  const dx = (b[0] - a[0]) * lonScale;
  const dy = (b[1] - a[1]) * latScale;
  return Math.sqrt(dx * dx + dy * dy);
}