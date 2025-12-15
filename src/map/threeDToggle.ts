import type maplibregl from 'maplibre-gl';
import { hide3DLayers, show3DLayers } from './enable3d';

const EXTRUSION_ID = 'campus-buildings-extrusion';

export function toggle3D(map: maplibregl.Map, force?: boolean) {
  const active = is3DActive(map);
  const to3D = force != null ? force : !active;
  if (to3D) {
    show3DLayers(map);
    map.easeTo({ pitch: 55, bearing: map.getBearing() || -30, duration: 600 });
  } else {
    hide3DLayers(map);
    map.easeTo({ pitch: 0, bearing: 0, duration: 550 });
  }
}

export function is3DActive(map: maplibregl.Map) {
  if (!map.getLayer(EXTRUSION_ID)) return false;
  const vis = map.getLayoutProperty(EXTRUSION_ID, 'visibility');
  return vis !== 'none' && map.getPitch() >= 25;
}