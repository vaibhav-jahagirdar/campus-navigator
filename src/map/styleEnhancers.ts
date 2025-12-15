import type maplibregl from 'maplibre-gl';

export function applyProLighting(map: maplibregl.Map) {
  // Directional-ish light for nicer building shading
  // MapLibre light spec follows v8; position is [r, g, b] spherical values.
  try {
    // @ts-ignore - MapLibre accepts "light" on style root
    map.setLight({
      anchor: 'map',
      color: '#ffffff',
      intensity: 0.6,
      position: [1.1, 210, 45]
    } as any);
  } catch {
    // no-op
  }
}

export function addProSky(map: maplibregl.Map) {
  if (map.getLayer('pro-sky')) return;
  // Subtle neutral gradient sky for pitch > 0
  try {
    // Cast to any to bypass incomplete style-spec typings for 'sky' layer
    map.addLayer({
      id: 'pro-sky',
      type: 'sky',
      paint: {
        'sky-type': 'gradient',
        'sky-gradient': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, 'rgba(14,18,28, 0.0)',
          7, 'rgba(14,18,28, 0.35)',
          12, 'rgba(14,18,28, 0.6)'
        ],
        'sky-gradient-center': [0, 0],
        'sky-gradient-radius': 90,
        'sky-opacity': 1
      }
    } as any);
  } catch {
    // Map style may not support sky; safe to ignore
  }
}