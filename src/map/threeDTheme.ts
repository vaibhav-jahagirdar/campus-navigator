import type maplibregl from 'maplibre-gl';

export type ThemeName = 'day' | 'dusk';

export interface Building3DTheme {
  bodyPalette: Record<string, string>;
  roofColor: string;
  shadowColor: string;
  light: {
    position: [number, number, number]; // [r, azimuth°, altitude°]
    intensity: number;
    color: string;
  };
  neutralFallback: string;
  heightCoolTint: string;
  heightWarmTint: string;
  topBlendFactor: number;
}

export const THEMES: Record<ThemeName, Building3DTheme> = {
  day: {
    bodyPalette: {
      Academic: '#4f59d8',
      Library:  '#774ada',
      Cafeteria:'#c13f80',
      Sports:   '#0d8d62',
      Parking:  '#57595d',
      Admin:    '#2392bd',
      Hostel:   '#c37310',
      Medical:  '#c03b3b',
      Lab:      '#5e66ce'
    },
    roofColor: '#ffffff',
    shadowColor: '#000000',
    neutralFallback: '#5e66ce',
    heightCoolTint: '#5fb4ff',
    heightWarmTint: '#ffd277',
    topBlendFactor: 0.35,
    light: { position: [1.25, 210, 55], intensity: 0.65, color: '#ffffff' }
  },
  dusk: {
    bodyPalette: {
      Academic: '#454fae',
      Library:  '#6440b5',
      Cafeteria:'#a5336a',
      Sports:   '#0a7150',
      Parking:  '#4a4c50',
      Admin:    '#1d7895',
      Hostel:   '#a95c0b',
      Medical:  '#a03030',
      Lab:      '#4e559f'
    },
    roofColor: '#f2f4ff',
    shadowColor: '#050509',
    neutralFallback: '#4e559f',
    heightCoolTint: '#4fa0f0',
    heightWarmTint: '#f5b45a',
    topBlendFactor: 0.45,
    light: { position: [1.15, 250, 35], intensity: 0.55, color: '#ffe2b0' }
  }
};

/**
 * Utility: run callback once the style is really ready.
 * Uses a lightweight 'render' polling because after some hot reloads
 * 'load' may already have fired.
 */
function whenStyleReady(map: maplibregl.Map, cb: () => void) {
  if (map.isStyleLoaded()) {
    cb();
    return;
  }
  const check = () => {
    if (map.isStyleLoaded()) {
      map.off('render', check);
      cb();
    }
  };
  map.on('render', check);
}

/**
 * Safely applies light; defers until style ready if needed.
 */
export function apply3DLight(map: maplibregl.Map, theme: Building3DTheme) {
  whenStyleReady(map, () => {
    try {
      map.setLight({
        anchor: 'map',
        position: theme.light.position,
        intensity: theme.light.intensity,
        color: theme.light.color
      });
    } catch (e) {
      console.warn('[3D] setLight failed (retrying next frame)', e);
      requestAnimationFrame(() => apply3DLight(map, theme));
    }
  });
}