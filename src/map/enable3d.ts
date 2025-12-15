import type maplibregl from 'maplibre-gl';
import { THEMES, type ThemeName, apply3DLight } from './building_themes';

export interface Building3DOptions {
  theme?: ThemeName;
  forceTestHeight?: number;
  levelHeightMeters?: number;
  minVisualMeters?: number;
  visualMultiplier?: number;
  roofCapMeters?: number;
  shadowOpacityMax?: number;
}

const LAYERS = {
  shadow: 'campus-buildings-shadow',
  extrusion: 'campus-buildings-extrusion',
  roof: 'campus-buildings-roof'
};

let pitchHandlerAttached = false;

function whenStyleReady(map: maplibregl.Map, cb: () => void) {
  if (map.isStyleLoaded()) { cb(); return; }
  const check = () => { if (map.isStyleLoaded()) { map.off('render', check); cb(); } };
  map.on('render', check);
}

export function enableBuildings3D(map: maplibregl.Map, opts: Building3DOptions = {}) {
  whenStyleReady(map, () => internalEnable(map, opts));
}

function internalEnable(map: maplibregl.Map, opts: Building3DOptions) {
  if (!map.getSource('campus-buildings')) {
    console.warn('[3D] campus-buildings source missing.');
    return;
  }
  const {
    theme = 'day',
    forceTestHeight,
    levelHeightMeters = 3.2,
    minVisualMeters = 10,
    visualMultiplier = 1.05,
    roofCapMeters = 0.35,
    shadowOpacityMax = 0.25
  } = opts;

  const heightExpr = buildHeightExpr({ forceTestHeight, levelHeightMeters, minVisualMeters, visualMultiplier });
  const beforeId = 'campus-buildings-label';
  const themeObj = THEMES[theme];

  if (!map.getLayer(LAYERS.shadow)) {
    map.addLayer({
      id: LAYERS.shadow,
      type: 'fill',
      source: 'campus-buildings',
      paint: { 'fill-color': themeObj.shadowColor, 'fill-opacity': 0 }
    }, beforeId);
  }

  if (!map.getLayer(LAYERS.extrusion)) {
    map.addLayer({
      id: LAYERS.extrusion,
      type: 'fill-extrusion',
      source: 'campus-buildings',
      paint: {
        'fill-extrusion-color': bodyColorExpr(themeObj),
        'fill-extrusion-height': heightExpr,
        'fill-extrusion-base': ['+', ['coalesce', ['to-number', ['get', 'min_height']], 0], 0.05],
        'fill-extrusion-opacity': 0.9,
        'fill-extrusion-vertical-gradient': true
      }
    }, beforeId);
  }

  if (!map.getLayer(LAYERS.roof)) {
    map.addLayer({
      id: LAYERS.roof,
      type: 'fill-extrusion',
      source: 'campus-buildings',
      paint: {
        'fill-extrusion-color': themeObj.roofColor,
        'fill-extrusion-base': heightExpr,
        'fill-extrusion-height': ['+', heightExpr, roofCapMeters],
        'fill-extrusion-opacity': 0.2,
        'fill-extrusion-vertical-gradient': false
      }
    }, beforeId);
  }

  apply3DLight(map, themeObj);
  attachPitchAdaptation(map, shadowOpacityMax);

  if (map.getPitch() < 30 && !forceTestHeight) {
    map.easeTo({ pitch: 55, bearing: -30, duration: 650 });
  }

  console.log('[3D] Buildings 3D enabled theme=', theme, 'exaggeration=', visualMultiplier);
}

function buildHeightExpr(cfg: { forceTestHeight?: number; levelHeightMeters: number; minVisualMeters: number; visualMultiplier: number; }) {
  const { forceTestHeight, levelHeightMeters, minVisualMeters, visualMultiplier } = cfg;
  if (forceTestHeight != null) return forceTestHeight;

  const computedHeight: any = [
    '*',
    [
      'coalesce',
      ['to-number', ['get', 'height']],
      ['*', ['coalesce', ['to-number', ['get', 'levels']], 1], levelHeightMeters]
    ],
    visualMultiplier
  ];

  return ['case', ['<', computedHeight, minVisualMeters], minVisualMeters, computedHeight] as any;
}

function bodyColorExpr(theme: any): any {
  return [
    'let', 'lv',
    ['coalesce', ['to-number', ['get', 'levels']], 1],
    [
      'case',
      ['==', ['get', 'category'], 'Academic'], paletteBlend(theme, 'Academic'),
      ['==', ['get', 'category'], 'Library'],  paletteBlend(theme, 'Library'),
      ['==', ['get', 'category'], 'Cafeteria'],paletteBlend(theme, 'Cafeteria'),
      ['==', ['get', 'category'], 'Sports'],   paletteBlend(theme, 'Sports'),
      ['==', ['get', 'category'], 'Parking'],  paletteBlend(theme, 'Parking'),
      ['==', ['get', 'category'], 'Admin'],    paletteBlend(theme, 'Admin'),
      ['==', ['get', 'category'], 'Hostel'],   paletteBlend(theme, 'Hostel'),
      ['==', ['get', 'category'], 'Medical'],  paletteBlend(theme, 'Medical'),
      ['==', ['get', 'category'], 'Lab'],      paletteBlend(theme, 'Lab'),
      paletteBlend(theme, 'NEUTRAL')
    ]
  ];
}

function paletteBlend(theme: any, cat: string) {
  const base = cat === 'NEUTRAL' ? theme.neutralFallback : theme.bodyPalette[cat];
  return ['case', ['>', ['var', 'lv'], 4], theme.heightCoolTint, ['>', ['var', 'lv'], 3], theme.heightWarmTint, base];
}

function attachPitchAdaptation(map: maplibregl.Map, shadowOpacityMax: number) {
  if (pitchHandlerAttached) return;
  const update = () => {
    const p = map.getPitch();
    if (map.getLayer(LAYERS.extrusion)) {
      let bodyO = 0.95;
      if (p < 5) bodyO = 0.0;
      else if (p < 15) bodyO = 0.45;
      else if (p < 30) bodyO = 0.80;
      else if (p < 50) bodyO = 0.92;
      map.setPaintProperty(LAYERS.extrusion, 'fill-extrusion-opacity', bodyO);
    }
    if (map.getLayer(LAYERS.roof)) {
      let roofO = 0.26;
      if (p < 10) roofO = 0.05;
      else if (p < 25) roofO = 0.12;
      else if (p < 40) roofO = 0.18;
      map.setPaintProperty(LAYERS.roof, 'fill-extrusion-opacity', roofO);
    }
    if (map.getLayer(LAYERS.shadow)) {
      const sh = Math.min(shadowOpacityMax, (p / 60) * shadowOpacityMax);
      map.setPaintProperty(LAYERS.shadow, 'fill-opacity', sh);
    }
  };
  map.on('pitch', update);
  map.on('moveend', update);
  update();
  pitchHandlerAttached = true;
}

export function hide3DLayers(map: maplibregl.Map) {
  Object.values(LAYERS).forEach(id => { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none'); });
}
export function show3DLayers(map: maplibregl.Map) {
  Object.values(LAYERS).forEach(id => { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible'); });
}