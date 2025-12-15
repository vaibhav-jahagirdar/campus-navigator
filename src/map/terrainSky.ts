import maplibregl from 'maplibre-gl';

interface TerrainSkyOptions {
  demExaggeration?: number;
  addSky?: boolean;                 // default off
  skyTheme?: 'day' | 'dusk';
  forceDisableSky?: boolean;
}

const ENV_ENABLE_SKY =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_SKY === '1';

function whenStyleReady(map: maplibregl.Map, cb: () => void) {
  if (map.isStyleLoaded()) { cb(); return; }
  const check = () => { if (map.isStyleLoaded()) { map.off('render', check); cb(); } };
  map.on('render', check);
}

export function addTerrainAndSky(map: maplibregl.Map, opts: TerrainSkyOptions = {}) {
  const { demExaggeration = 1.15, addSky = false, skyTheme = 'day', forceDisableSky = false } = opts;
  whenStyleReady(map, () => {
    addTerrain(map, demExaggeration);
    if (!forceDisableSky && addSky && ENV_ENABLE_SKY) {
      try {
        addSkyLayer(map, skyTheme);
      } catch (e) {
        console.warn('[Sky] Disabled; runtime rejected sky layer.', e);
      }
    } else if (addSky && !ENV_ENABLE_SKY) {
      console.info('[Sky] Skipped. Set NEXT_PUBLIC_ENABLE_SKY=1 to try real sky.');
    }
  });
}

function addTerrain(map: maplibregl.Map, exaggeration: number) {
  if (map.getSource('terrain-dem')) return;
  try {
    map.addSource('terrain-dem', {
      type: 'raster-dem',
      url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
      tileSize: 256
    });
    map.setTerrain({ source: 'terrain-dem', exaggeration });
    console.log('[Terrain] DEM added (exaggeration=', exaggeration, ')');
  } catch (e) {
    console.warn('[Terrain] Could not set terrain:', e);
  }
}

function addSkyLayer(map: maplibregl.Map, theme: 'day' | 'dusk') {
  const paint = theme === 'dusk'
    ? { 'sky-type': 'atmosphere', 'sky-atmosphere-color': '#172033', 'sky-atmosphere-halo-color': '#5a4d70', 'sky-atmosphere-sun': [0.4, 90], 'sky-opacity': 1 }
    : { 'sky-type': 'atmosphere', 'sky-atmosphere-color': '#1a2230', 'sky-atmosphere-halo-color': '#364866', 'sky-atmosphere-sun': [0.6, 90], 'sky-opacity': 1 };
  map.addLayer({ id: 'campus-sky', type: 'sky', paint } as any);
  console.log('[Sky] Real sky layer added (theme=', theme, ').');
}