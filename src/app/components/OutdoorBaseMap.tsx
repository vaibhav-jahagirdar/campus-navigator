"use client"
import type * as GeoJSON from "geojson"
import type React from "react"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import maplibregl from "maplibre-gl"
import { addOrUpdateEntranceConnectors } from "@/map/entranceConnector"
import { buildGraph, type CampusGraph, shortestPath, findNearestNode } from "./campusRouter"
import { enableBuildings3D } from "@/map/enable3d"
import { toggle3D } from "@/map/threeDToggle"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MapPin, Navigation, X, Layers, Compass, LocateFixed, Route, Map, Zap } from "lucide-react"

/** * =============================================================== * Outdoor / Campus Map (Pro-styled) * - Hard outside mask (only campus visible) * - Muted, professional palette * - Refined selection/hover * - Optional sky + lighting (safe try/catch) * - Screen-aware framing and pitch * =============================================================== */

/* ================== Visual Theme (tokens) ================== */
const THEME = {
  color: {
    canvas: "#0a0e13",
    surface: "rgba(15,18,25,0.75)",
    surfaceSubtle: "rgba(15,18,25,0.65)",
    border: "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,255,255,0.14)",
    text: "#f0f4f9",
    textMuted: "rgba(240,244,249,0.65)",
    halo: "#0a0e13",
    accent: "#06b6d4",
    accentStrong: "#22d3ee",
    campusLine: "#0891b2",
    outdoor: {
      water: "#0284c7",
      waterOutline: "#0ea5e9",
      ground: "#10b981",
      groundOutline: "#34d399",
    },
    building: {
      Academic: "#3b82f6",
      Admin: "#06b6d4",
      Auditorium: "#8b5cf6",
      Cafeteria: "#ec4899",
      Library: "#6366f1",
      Parking: "#6b7280",
      Hostel: "#f59e0b",
      Sports: "#14b8a6",
      Medical: "#ef4444",
      Lab: "#7c3aed",
      Other: "#64748b",
    },
  },
  radius: { sm: 8, md: 12, lg: 14 },
  shadow: {
    panel: "0 20px 50px -12px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)",
    soft: "0 8px 24px -10px rgba(0,0,0,0.5)",
    chip: "0 4px 12px -4px rgba(0,0,0,0.4)",
  },
}

/* ================== Config ================== */
const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [77.48125, 13.0834],
  [77.4866, 13.0871],
]

const UI_PADDING = { top: 150, right: 340, bottom: 80, left: 80 }
const OSRM_BASE = "https://router.project-osrm.org"
const ROUTE_PROFILE = "foot"
const DEFAULT_WALK_SPEED_MS = 1.4
const INTERNAL_ROUTE_MAX_SNAP_METERS = 60
const INTERNAL_ROUTE_RELAXED_MAX = 150
const BUILDING_SNAP_MAX = 120

const INITIAL_CENTER: [number, number] = [
  (CAMPUS_BOUNDS[0][0] + CAMPUS_BOUNDS[1][0]) / 2,
  (CAMPUS_BOUNDS[0][1] + CAMPUS_BOUNDS[1][1]) / 2,
]

const INITIAL_ZOOM = 17

const CATEGORY_COLORS: Record<string, string> = {
  Academic: THEME.color.building.Academic,
  Library: THEME.color.building.Library,
  Cafeteria: THEME.color.building.Cafeteria,
  Sports: THEME.color.building.Sports,
  Parking: THEME.color.building.Parking,
  Admin: THEME.color.building.Admin,
  Hostel: THEME.color.building.Hostel,
  Medical: THEME.color.building.Medical,
  Lab: THEME.color.building.Lab,
  Other: THEME.color.building.Other,
}

const DEFAULT_CATEGORY_COLOR = THEME.color.building.Other

/* ================== Outdoor Features ================== */
const CAMPUS_OUTDOOR_FEATURES = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { "@id": "way/133118477", leisure: "pitch", name: "Acharya Stadium", "name:kn": "ಅಚಾರ್ಯ ಕ್ರೀಡಾಂಗಣ" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.4824201, 13.0862197],
            [77.482245, 13.0859489],
            [77.4822085, 13.0856931],
            [77.4822726, 13.0854399],
            [77.4823859, 13.0852713],
            [77.4825182, 13.0851585],
            [77.48276, 13.0850571],
            [77.4830048, 13.0850464],
            [77.4833162, 13.0851636],
            [77.4834693, 13.0853046],
            [77.4835722, 13.0854817],
            [77.4836177, 13.0857716],
            [77.4835712, 13.085977],
            [77.483513, 13.0860906],
            [77.4832893, 13.0863099],
            [77.4830888, 13.0863939],
            [77.4827455, 13.0863958],
            [77.4826225, 13.0863544],
            [77.4824201, 13.0862197],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        "@id": "way/133119265",
        leisure: "pitch",
        name: "Basket Ball Court",
        "name:kn": "ಬಾಸ್ಕೆಟ್ ಬಾಲ್ ಅಂಕಣ",
        sport: "basketball",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.4836992, 13.0858227],
            [77.4836868, 13.0854415],
            [77.4841419, 13.0854274],
            [77.4841544, 13.0858086],
            [77.4836992, 13.0858227],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { "@id": "way/726086470", intermittent: "no", name: "Acharya Lake", natural: "water", water: "lake" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.482196, 13.0868964],
            [77.4820082, 13.0867292],
            [77.4821155, 13.0863425],
            [77.4823462, 13.0863007],
            [77.4829604, 13.0865045],
            [77.4832447, 13.0864784],
            [77.4832983, 13.0866064],
            [77.4831267, 13.086899],
            [77.4827968, 13.0869199],
            [77.4824588, 13.0868128],
            [77.482196, 13.0868964],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { "@id": "way/726182044", leisure: "park", name: "Football Ground", "name:kn": "ಫುಟ್ಬಾಲ್ ಆಟದ ಮೈದಾನ" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.4840963, 13.084931],
            [77.4841196, 13.0852828],
            [77.4837512, 13.085306],
            [77.4837279, 13.0849542],
            [77.4840963, 13.084931],
          ],
        ],
      },
    },
  ],
} as unknown as GeoJSON.FeatureCollection

const OUTDOOR_FEATURES_WITH_KIND: GeoJSON.FeatureCollection = {
  ...CAMPUS_OUTDOOR_FEATURES,
  features: (CAMPUS_OUTDOOR_FEATURES as any).features.map((f: any) => {
    const p: any = { ...(f.properties || {}) }
    let kind = "other"
    if (p.natural === "water" || p.water) kind = "water"
    else if (
      p.leisure === "pitch" ||
      p.leisure === "stadium" ||
      p.leisure === "court" ||
      p.sport ||
      /football/i.test(p.name || "")
    )
      kind = "ground"
    else if (p.leisure === "park" && /ground/i.test(p.name || "")) kind = "ground"
    return { ...f, properties: { ...p, __kind: kind } } as GeoJSON.Feature
  }),
}

/* ================== Types ================== */
interface BuildingProps {
  id?: string
  name?: string
  category?: string
  levels?: number
  source?: string
  featureId?: string | number
}

interface PositionState {
  lon: number
  lat: number
  accuracy: number
  heading?: number | null
  speed?: number | null
  timestamp: number
}

interface IndexedFeature {
  id: string
  source: "buildings" | "outdoor"
  geometryType: "Polygon" | "MultiPolygon" | "Point"
  name?: string
  altNames: string[]
  category?: string
  kind?: string
  raw: any
  center: [number, number]
}

interface RouteState {
  geojson: GeoJSON.FeatureCollection | null
  distance: number
  duration: number
  fetched: boolean
  error?: string
  steps?: any[]
}

type SnapInfo = { nodeId: number; dist: number }
type Endpoint = {
  coord: [number, number]
  routeCoord?: [number, number]
  label: string
  featureId?: string
  snapInfo?: SnapInfo
}

/* ================== Utilities ================== */
function createHeadingImageData() {
  const size = 64
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!
  ctx.translate(size / 2, size / 2)
  ctx.fillStyle = "#60a5fa"
  ctx.beginPath()
  ctx.moveTo(0, -22)
  ctx.lineTo(11, 10)
  ctx.lineTo(-11, 10)
  ctx.closePath()
  ctx.fill()
  const imgData = ctx.getImageData(0, 0, size, size)
  return { width: size, height: size, data: imgData.data }
}

function makeAccuracyPolygon(lon: number, lat: number, radiusMeters: number): GeoJSON.Polygon {
  const steps = 40
  const earth = 6378137
  const coords: [number, number][] = []
  const radLat = (lat * Math.PI) / 180
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2
    const dx = radiusMeters * Math.cos(angle)
    const dy = radiusMeters * Math.sin(angle)
    const newLon = lon + ((dx / (earth * Math.cos(radLat))) * 180) / Math.PI
    const newLat = lat + ((dy / earth) * 180) / Math.PI
    coords.push([newLon, newLat])
  }
  coords.push(coords[0])
  return { type: "Polygon", coordinates: [coords] }
}

function buildCampusBoundaryFeature(): GeoJSON.Feature<GeoJSON.Polygon> {
  const [[minLon, minLat], [maxLon, maxLat]] = CAMPUS_BOUNDS
  const ring: [number, number][] = [
    [minLon, minLat],
    [maxLon, minLat],
    [maxLon, maxLat],
    [minLon, maxLat],
    [minLon, minLat],
  ]
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [ring] },
    properties: { type: "campus-boundary" },
  }
}

function buildCampusMaskFeature(): GeoJSON.Feature<GeoJSON.Polygon> {
  const world: [number, number][] = [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
    [-180, -85],
  ]
  const [[minLon, minLat], [maxLon, maxLat]] = CAMPUS_BOUNDS
  const campusRing: [number, number][] = [
    [minLon, minLat],
    [minLon, maxLat],
    [maxLon, maxLat],
    [maxLon, minLat],
    [minLon, minLat],
  ]
  const campusHole = [...campusRing].reverse()
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [world, campusHole] },
    properties: { type: "campus-mask" },
  }
}

function centroid(feature: any): [number, number] {
  const geom = feature.geometry
  if (!geom) return [0, 0]
  if (geom.type === "Point") return geom.coordinates.slice(0, 2)
  let area = 0,
    cx = 0,
    cy = 0
  const processRing = (coords: any[]) => {
    for (let i = 0, len = coords.length - 1; i < len; i++) {
      const [x1, y1] = coords[i]
      const [x2, y2] = coords[i + 1]
      const a = x1 * y2 - x2 * y1
      area += a
      cx += (x1 + x2) * a
      cy += (y1 + y2) * a
    }
  }
  if (geom.type === "Polygon") processRing(geom.coordinates[0])
  else if (geom.type === "MultiPolygon") geom.coordinates.forEach((poly: any) => processRing(poly[0]))
  else return [0, 0]
  area *= 0.5
  if (area === 0)
    return geom.type === "Polygon" ? geom.coordinates[0][0].slice(0, 2) : geom.coordinates[0][0][0].slice(0, 2)
  return [cx / (6 * area), cy / (6 * area)]
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(m: number) {
  if (m < 1000) return `${m.toFixed(0)} m`
  return `${(m / 1000).toFixed(2)} km`
}

function formatDuration(s: number) {
  if (s < 60) return `${Math.round(s)}s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${h}h ${mm}m`
}

function fuzzyScore(query: string, text: string) {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (t === q) return 200
  if (t.startsWith(q)) return 120
  const idx = t.indexOf(q)
  if (idx >= 0) return 100 - idx
  let qi = 0
  let score = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      score += 3
      qi++
    }
  }
  return qi === q.length ? score : 0
}

function applyProLighting(map: maplibregl.Map) {
  try {
    // @ts-ignore
    map.setLight({
      anchor: "map",
      color: "#ffffff",
      intensity: 0.6,
      position: [1.1, 210, 45],
    } as any)
  } catch {}
}

const ENABLE_SKY = typeof process !== "undefined" && process.env.NEXT_PUBLIC_ENABLE_SKY === "1"

function supportsSky(): boolean {
  if (!ENABLE_SKY) return false
  const v = (maplibregl as any).version || ""
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!m) return false
  const major = Number.parseInt(m[1], 10)
  const minor = Number.parseInt(m[2], 10)
  return major > 2 || (major === 2 && minor >= 4)
}

function addProSky(map: maplibregl.Map) {
  if (!supportsSky()) return
  if (map.getLayer("pro-sky")) return
  try {
    map.addLayer({
      id: "pro-sky",
      type: "sky",
      paint: {
        "sky-type": "gradient",
        "sky-gradient": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          "rgba(14,18,28,0.0)",
          7,
          "rgba(14,18,28,0.35)",
          12,
          "rgba(14,18,28,0.6)",
        ],
        "sky-gradient-center": [0, 0],
        "sky-gradient-radius": 90,
        "sky-opacity": 1,
      },
    } as any)
  } catch {}
}

function addAtmosBackground(map: maplibregl.Map) {
  if (map.getLayer("pro-bg")) return
  try {
    map.addLayer({
      id: "pro-bg",
      type: "background",
      paint: {
        "background-color": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          "rgba(14,18,28,0.0)",
          7,
          "rgba(14,18,28,0.35)",
          12,
          "rgba(14,18,28,0.6)",
        ],
      },
    } as any)
  } catch {}
}

/* ================== Component ================== */
export default function OutdoorBaseMap() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [hoverInfo, setHoverInfo] = useState<BuildingProps | null>(null)
  const [selected, setSelected] = useState<BuildingProps | null>(null)
  const hoverIdRef = useRef<string | number | null>(null)
  const selectedIdRef = useRef<string | number | null>(null)
  const [legendCats, setLegendCats] = useState<string[]>([])
  const [tracking, setTracking] = useState(false)
  const [follow, setFollow] = useState(false)
  const [posState, setPosState] = useState<PositionState | null>(null)
  const [geoStatus, setGeoStatus] = useState<string>("Idle")
  const watchIdRef = useRef<number | null>(null)
  const lastMoveCenterRef = useRef<[number, number] | null>(null)
  const lastHeadingRef = useRef<number | null>(null)
  const headingImageAddedRef = useRef<boolean>(false)
  const longPressTimer = useRef<number | null>(null)
  const [indexedFeatures, setIndexedFeatures] = useState<IndexedFeature[]>([])
  const buildingsDataRef = useRef<any>(null)
  const [directionsMode, setDirectionsMode] = useState(false)
  const [routeState, setRouteState] = useState<RouteState>({ geojson: null, distance: 0, duration: 0, fetched: false })
  const [routeProgress, setRouteProgress] = useState<{
    traveled: number
    remaining: number
    etaSeconds: number
  } | null>(null)
  const [startPoint, setStartPoint] = useState<Endpoint | null>(null)
  const [endPoint, setEndPoint] = useState<Endpoint | null>(null)
  const [directionsStatus, setDirectionsStatus] = useState<string>("Choose start & destination")
  const [selectingEndpoint, setSelectingEndpoint] = useState<"start" | "end" | null>(null)
  const [campusGraph, setCampusGraph] = useState<CampusGraph | null>(null)
  const [navigationMode, setNavigationMode] = useState(false)
  const [destinationPoint, setDestinationPoint] = useState<Endpoint | null>(null)
  const routeStartRef = useRef<[number, number] | null>(null)
  const lastRouteComputeRef = useRef<number>(0)
  const lastProgressTraveledRef = useRef<number>(0)
  // Stable anti-flicker GPS fallback store
  const lastGoodRef = useRef<{ lon: number; lat: number; accuracy: number } | null>(null)
  const OFF_ROUTE_DISTANCE_THRESHOLD = 25
  const RECOMPUTE_DISTANCE_THRESHOLD = 60
  const [threeDFlag, setThreeDFlag] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<IndexedFeature[]>([])
  const [searchActiveIndex, setSearchActiveIndex] = useState(0)
  // Add these THREE new refs after your existing refs
  const isRoutingRef = useRef<boolean>(false)
  const lastRerouteTimeRef = useRef<number>(0)

  // Add these TWO new constants after your existing constants
  const MAX_NAVIGATION_DISTANCE = 5000 // Don't auto-reroute if >5km from destination
  const REROUTE_DEBOUNCE_MS = 3000 // Wait 3s between reroutes
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null)
  /* ========== Load Internal Graph ========== */
  useEffect(() => {
    let cancelled = false
    async function loadCampusPaths() {
      try {
        const res = await fetch("/data/campus-paths.geojson")
        if (!res.ok) throw new Error("Failed to fetch campus-paths.geojson")
        const gj = await res.json()
        const g = buildGraph(gj)
        if (!cancelled) {
          setCampusGraph(g)
          const edgeCount = Array.from(g.adjacency.values()).reduce((a, l) => a + l.length, 0)
          console.log("[CampusGraph] nodes:", g.nodes.length, "edges:", edgeCount)
        }
      } catch (e) {
        console.error("[CampusGraph] load error", e)
      }
    }
    loadCampusPaths()
    return () => {
      cancelled = true
    }
  }, [])

  /* ========== Helper: Clear Selection ========== */
  const clearSelection = useCallback((map?: maplibregl.Map) => {
    if (map && selectedIdRef.current !== null) {
      if (map.getSource("campus-buildings")) {
        map.setFeatureState({ source: "campus-buildings", id: selectedIdRef.current }, { selected: false })
      }
      if (map.getSource("campus-outdoor")) {
        map.setFeatureState({ source: "campus-outdoor", id: selectedIdRef.current }, { selected: false })
      }
    }
    selectedIdRef.current = null
    setSelected(null)
  }, [])

  /* ========== Geolocation Tracking ========== */
  function startTracking() {
    if (!("geolocation" in navigator)) {
      setGeoStatus("Unsupported")
      return
    }

    try {
      setGeoStatus("Requesting...")

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          let { longitude, latitude, accuracy, heading, speed } = pos.coords

          // Normalize values
          const normalizedHeading = heading != null && !Number.isNaN(heading) ? heading : null
          const acc = accuracy ?? 999

          // ---------- 1. Reject bad fixes ----------
          const isBad =
            acc > 40 ||
            (lastGoodRef.current &&
              haversineM(lastGoodRef.current.lat, lastGoodRef.current.lon, latitude, longitude) > 20)

          if (isBad) {
            if (lastGoodRef.current) {
              // Use last stable coord instead
              longitude = lastGoodRef.current.lon
              latitude = lastGoodRef.current.lat
              accuracy = lastGoodRef.current.accuracy
            } else {
              // First reading and it's trash → ignore
              return
            }
          }

          // ---------- 2. Store GOOD fix ----------
          lastGoodRef.current = {
            lon: longitude,
            lat: latitude,
            accuracy: acc,
          }

          // ---------- 3. Update UI state ----------
          const newPos: PositionState = {
            lon: longitude,
            lat: latitude,
            accuracy: accuracy ?? 15,
            heading: normalizedHeading,
            speed: speed ?? null,
            timestamp: pos.timestamp,
          }

          setPosState(newPos)
          setGeoStatus("Tracking")

          if (!tracking) setTracking(true)
          if (!follow) setFollow(true)

          // ---------- 4. Update map ----------
          updateLocationOnMap(longitude, latitude, accuracy ?? 15, normalizedHeading)

          // ---------- 5. Update navigation progress ----------
          if (routeState.geojson) {
            updateRouteProgress(newPos, routeState)
          }
        },

        (err) => {
          setGeoStatus(err.message || "Error")
          stopTracking()
        },

        { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
      )

      watchIdRef.current = id
    } catch (e: any) {
      setGeoStatus(e.message || "Start error")
    }
  }

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setTracking(false)
    setFollow(false)
    setPosState(null)
    setGeoStatus("Stopped")
    const map = mapRef.current
    if (map?.getSource("user-point")) {
      ;(map.getSource("user-point") as maplibregl.GeoJSONSource).setData({ type: "FeatureCollection", features: [] })
    }
    if (map?.getSource("user-accuracy")) {
      ;(map.getSource("user-accuracy") as maplibregl.GeoJSONSource).setData({ type: "FeatureCollection", features: [] })
    }
  }

  function updateLocationOnMap(lon: number, lat: number, accuracy: number, heading: number | null) {
    const map = mapRef.current
    if (!map) return

    // ====== 1. Init Sources ======
    if (!map.getSource("user-point")) {
      map.addSource("user-point", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })

      map.addLayer({
        id: "user-point-circle",
        type: "circle",
        source: "user-point",
        paint: {
          "circle-radius": 6,
          "circle-color": "#2563eb",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      })
    }

    if (!map.getSource("user-accuracy")) {
      map.addSource("user-accuracy", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })

      map.addLayer({
        id: "user-accuracy-fill",
        type: "fill",
        source: "user-accuracy",
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.15 },
      })

      map.addLayer({
        id: "user-accuracy-outline",
        type: "line",
        source: "user-accuracy",
        paint: {
          "line-color": "#3b82f6",
          "line-width": 1,
          "line-opacity": 1,
        },
      })
    }

    // ====== 2. Heading icon ======
    if (!headingImageAddedRef.current) {
      try {
        map.addImage("heading-triangle", createHeadingImageData() as any, { pixelRatio: 2 })

        map.addLayer({
          id: "user-heading",
          type: "symbol",
          source: "user-point",
          layout: {
            "icon-image": "heading-triangle",
            "icon-size": 0.6,
            "icon-allow-overlap": true,
            "icon-rotation-alignment": "map",
            "icon-rotate": ["get", "heading"],
          },
          filter: ["has", "heading"],
        })

        headingImageAddedRef.current = true
      } catch {
        headingImageAddedRef.current = true
      }
    }

    // ====== 3. Set point + accuracy polygon ======
    const point: any = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lon, lat] },
      properties: {},
    }

    if (heading != null) {
      point.properties.heading = heading
      lastHeadingRef.current = heading
    }
    ;(map.getSource("user-point") as maplibregl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features: [point],
    })

    const safeAccuracy = Math.min(Math.max(accuracy, 5), 80)
    const accuracyPoly = makeAccuracyPolygon(lon, lat, safeAccuracy)
    ;(map.getSource("user-accuracy") as maplibregl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry: accuracyPoly, properties: {} }],
    })

    // ====== 4. FOLLOW MODE (fixed!) ======
    if (follow) {
      const nowCenter: [number, number] = [lon, lat]
      const last = lastMoveCenterRef.current

      // Prevent jitter: move only if > 4m change
      if (last) {
        const d = haversineM(last[1], last[0], lat, lon)
        if (d < 4) return // no move small drift
      }

      // Prevent re-center spam due to bad accuracy
      if (accuracy > 40) return

      map.easeTo({
        center: nowCenter,
        duration: 450,
        padding: UI_PADDING as any,
      })

      lastMoveCenterRef.current = nowCenter
    }
  }

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    function onDragStart() {
      if (follow) setFollow(false)
    }
    map.on("dragstart", onDragStart)
    return () => {
      map.off("dragstart", onDragStart)
    }
  }, [follow])

  /* ========== Map Initialization ========== */
  useEffect(() => {
    const styleUrl = `https://api.maptiler.com/maps/basic-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`
    const map = new maplibregl.Map({
      container: containerRef.current!,
      style: styleUrl,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 15.5,
      maxZoom: 21,
      maxBounds: CAMPUS_BOUNDS,
      attributionControl: false,
      antialias: true,
      renderWorldCopies: false,
    })

    mapRef.current = map
    // @ts-ignore
    ;(window as any).__MAPDEBUG__ = map

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right")
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right")

    map.on("load", async () => {
      map.fitBounds(CAMPUS_BOUNDS, { padding: UI_PADDING as any, maxZoom: 18.3 })
      applyProLighting(map)
      if (supportsSky()) {
        addProSky(map)
      } else {
        addAtmosBackground(map)
      }

      map.addSource("campus-boundary-src", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [buildCampusBoundaryFeature()] },
      })
      map.addSource("campus-mask-src", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [buildCampusMaskFeature()] },
      })

      map.addLayer({
        id: "campus-outside-dim",
        type: "fill",
        source: "campus-mask-src",
        paint: { "fill-color": THEME.color.canvas, "fill-opacity": 1.0 },
      })

      map.addLayer({
        id: "campus-boundary-glow-1",
        type: "line",
        source: "campus-boundary-src",
        paint: { "line-color": THEME.color.campusLine, "line-width": 12, "line-opacity": 0.1 },
      })
      map.addLayer({
        id: "campus-boundary-glow-2",
        type: "line",
        source: "campus-boundary-src",
        paint: { "line-color": THEME.color.campusLine, "line-width": 7, "line-opacity": 0.18 },
      })
      map.addLayer({
        id: "campus-boundary-line",
        type: "line",
        source: "campus-boundary-src",
        paint: { "line-color": THEME.color.campusLine, "line-width": 2.0, "line-opacity": 0.95 },
      })

      map.easeTo({
        padding: UI_PADDING as any,
        pitch: 52,
        bearing: -17,
        duration: 700,
      })

      map.addSource("campus-outdoor", { type: "geojson", data: OUTDOOR_FEATURES_WITH_KIND, promoteId: "@id" })
      map.addLayer({
        id: "campus-outdoor-fill",
        type: "fill",
        source: "campus-outdoor",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "__kind"], "water"],
            THEME.color.outdoor.water,
            ["==", ["get", "__kind"], "ground"],
            THEME.color.outdoor.ground,
            "#6b7280",
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            0.9,
            ["boolean", ["feature-state", "hover"], false],
            0.75,
            0.55,
          ],
        },
      })

      map.addLayer({
        id: "campus-outdoor-outline",
        type: "line",
        source: "campus-outdoor",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "__kind"], "water"],
            THEME.color.outdoor.waterOutline,
            ["==", ["get", "__kind"], "ground"],
            THEME.color.outdoor.groundOutline,
            "#a4acb7",
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            3.0,
            ["boolean", ["feature-state", "hover"], false],
            2.2,
            1.4,
          ],
          "line-opacity": 0.9,
        },
      })

      map.addLayer({
        id: "campus-outdoor-label",
        type: "symbol",
        source: "campus-outdoor",
        layout: {
          "text-field": ["coalesce", ["get", "name"], ""],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 11,
        },
        paint: {
          "text-color": THEME.color.text,
          "text-halo-color": THEME.color.halo,
          "text-halo-width": 1,
        },
      })

      map.on("mousemove", "campus-outdoor-fill", (e) => {
        if (!e.features?.length) return
        const f = e.features[0]
        const fid = f.id as string | number
        if (hoverIdRef.current !== null && hoverIdRef.current !== fid) {
          if (map.getSource("campus-outdoor"))
            map.setFeatureState({ source: "campus-outdoor", id: hoverIdRef.current }, { hover: false })
          if (map.getSource("campus-buildings"))
            map.setFeatureState({ source: "campus-buildings", id: hoverIdRef.current }, { hover: false })
        }
        hoverIdRef.current = fid
        map.setFeatureState({ source: "campus-outdoor", id: fid }, { hover: true })
        const p: any = f.properties || {}
        setHoverInfo({
          id: p["@id"] || p.id,
          name: p.name,
          category: p.__kind === "water" ? "Water" : p.__kind === "ground" ? "Ground" : "Outdoor",
          source: "OSM",
          featureId: fid,
        })
        map.getCanvas().style.cursor = "pointer"
      })

      map.on("mouseleave", "campus-outdoor-fill", () => {
        if (hoverIdRef.current !== null) {
          map.setFeatureState({ source: "campus-outdoor", id: hoverIdRef.current }, { hover: false })
          hoverIdRef.current = null
        }
        setHoverInfo(null)
        map.getCanvas().style.cursor = ""
      })

      map.on("click", "campus-outdoor-fill", (e) => {
        if (!e.features?.length) return
        const f = e.features[0]
        const id = f.id as string | number
        if (selectedIdRef.current !== null) {
          if (map.getSource("campus-buildings"))
            map.setFeatureState({ source: "campus-buildings", id: selectedIdRef.current }, { selected: false })
          if (map.getSource("campus-outdoor"))
            map.setFeatureState({ source: "campus-outdoor", id: selectedIdRef.current }, { selected: false })
        }
        if (selectedIdRef.current === id) {
          selectedIdRef.current = null
          setSelected(null)
          return
        }
        selectedIdRef.current = id
        map.setFeatureState({ source: "campus-outdoor", id }, { selected: true })
        const p: any = f.properties || {}
        setSelected({
          id: p["@id"] || p.id,
          name: p.name,
          category: p.__kind === "water" ? "Water" : p.__kind === "ground" ? "Ground" : "Outdoor",
          source: "OSM",
          featureId: id,
        })
        if (directionsMode && selectingEndpoint) {
          const c = centroid(f)
          const label = p.name || p.__kind || "Feature"
          setEndpointFromCoord(c, label, p["@id"] || p.id, selectingEndpoint === "start")
        }
        if (navigationMode) {
          const c = centroid(f)
          setDestinationPoint(makeSnappedEndpoint(c, p.name || p.__kind || "Destination", String(p["@id"] || p.id)))
          if (posState) {
            const startCoord: [number, number] = [posState.lon, posState.lat]
            const snappedDest = destinationPoint?.routeCoord || c
            fetchRoute(startCoord, snappedDest)
            routeStartRef.current = startCoord
            lastRouteComputeRef.current = Date.now()
            lastProgressTraveledRef.current = 0
          }
        }
      })

      try {
        const geojson = await fetch("/data/buildings.geojson").then((r) => {
          if (!r.ok) throw new Error("Failed to load buildings.geojson")
          return r.json()
        })
        buildingsDataRef.current = geojson
        map.addSource("campus-buildings", { type: "geojson", data: geojson, promoteId: "id" })

        const matchExpression: any = [
          "match",
          ["get", "category"],
          ...Object.entries(CATEGORY_COLORS).flat(),
          DEFAULT_CATEGORY_COLOR,
        ]

        map.addLayer({
          id: "campus-buildings-fill",
          type: "fill",
          source: "campus-buildings",
          paint: {
            "fill-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              THEME.color.accent,
              matchExpression,
            ],
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              0.92,
              ["boolean", ["feature-state", "hover"], false],
              0.82,
              0.68,
            ],
            "fill-antialias": true,
          },
        })

        map.addLayer({
          id: "campus-buildings-outline",
          type: "line",
          source: "campus-buildings",
          paint: {
            "line-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              "#ffffff",
              ["boolean", ["feature-state", "hover"], false],
              "#f2f4f7",
              "#cbd5e1",
            ],
            "line-width": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              2.6,
              ["boolean", ["feature-state", "hover"], false],
              1.8,
              1.2,
            ],
            "line-opacity": 0.95,
          },
        })

        map.addLayer({
          id: "campus-buildings-label",
          type: "symbol",
          source: "campus-buildings",
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-size": 11,
          },
          paint: {
            "text-color": THEME.color.text,
            "text-halo-color": THEME.color.halo,
            "text-halo-width": 1,
          },
        })

        enableBuildings3D(map)
        setThreeDFlag(true)
        addOrUpdateEntranceConnectors(map)

        map.on("mousemove", "campus-buildings-fill", (e) => {
          if (!e.features?.length) return
          const f = e.features[0]
          const newId = f.id as string | number | undefined
          if (!newId) return
          if (hoverIdRef.current !== null && hoverIdRef.current !== newId) {
            if (map.getSource("campus-buildings")) {
              map.setFeatureState({ source: "campus-buildings", id: hoverIdRef.current }, { hover: false })
            }
            if (map.getSource("campus-outdoor")) {
              map.setFeatureState({ source: "campus-outdoor", id: hoverIdRef.current }, { hover: false })
            }
          }
          hoverIdRef.current = newId
          map.setFeatureState({ source: "campus-buildings", id: newId }, { hover: true })
          const p = f.properties as any
          setHoverInfo({
            id: p.id,
            name: p.name,
            category: p.category,
            levels: p.levels,
            source: p.source,
            featureId: newId,
          })
          map.getCanvas().style.cursor = "pointer"
        })

        map.on("mouseleave", "campus-buildings-fill", () => {
          if (hoverIdRef.current !== null) {
            if (map.getSource("campus-buildings")) {
              map.setFeatureState({ source: "campus-buildings", id: hoverIdRef.current }, { hover: false })
            }
            if (map.getSource("campus-outdoor")) {
              map.setFeatureState({ source: "campus-outdoor", id: hoverIdRef.current }, { hover: false })
            }
            hoverIdRef.current = null
          }
          setHoverInfo(null)
          map.getCanvas().style.cursor = ""
        })

        map.on("click", "campus-buildings-fill", (e) => {
          if (!e.features?.length) return
          const f = e.features[0]
          const id = f.id as string | number | undefined
          if (!id) return
          if (selectedIdRef.current !== null) {
            if (map.getSource("campus-buildings")) {
              map.setFeatureState({ source: "campus-buildings", id: selectedIdRef.current }, { selected: false })
            }
            if (map.getSource("campus-outdoor")) {
              map.setFeatureState({ source: "campus-outdoor", id: selectedIdRef.current }, { selected: false })
            }
          }
          if (selectedIdRef.current === id) {
            map.setFeatureState({ source: "campus-buildings", id }, { selected: false })
            selectedIdRef.current = null
            setSelected(null)
            return
          }
          selectedIdRef.current = id
          map.setFeatureState({ source: "campus-buildings", id }, { selected: true })
          const p = f.properties as any
          setSelected({
            id: p.id,
            name: p.name,
            category: p.category,
            levels: p.levels,
            source: p.source,
            featureId: id,
          })
          if (directionsMode && selectingEndpoint) {
            const c = centroid(f)
            const label = p.name || "Building"
            setEndpointFromCoord(c, label, String(p.id), selectingEndpoint === "start")
          }
          if (navigationMode) {
            const c = centroid(f)
            setDestinationPoint(makeSnappedEndpoint(c, p.name || "Destination", String(p.id)))
            if (posState) {
              const startCoord: [number, number] = [posState.lon, posState.lat]
              fetchRoute(startCoord, destinationPoint?.routeCoord || c)
              routeStartRef.current = startCoord
              lastRouteComputeRef.current = Date.now()
              lastProgressTraveledRef.current = 0
            }
          }
        })

        map.on("click", (e) => {
          const feats = map.queryRenderedFeatures(e.point, { layers: ["campus-buildings-fill", "campus-outdoor-fill"] })
          if (feats.length === 0) clearSelection(map)
        })

        const present: string[] = []
        for (const f of geojson.features || []) {
          const cat = (f.properties || {}).category
          if (cat && !present.includes(cat)) present.push(cat)
        }
        present.sort()
        setLegendCats(present)
        indexAllFeatures(geojson, OUTDOOR_FEATURES_WITH_KIND)
      } catch (err) {
        console.error("[Campus] Error loading buildings", err)
      }

      /** rest of code here **/
      map.addSource("campus-route", { type: "geojson", data: { type: "FeatureCollection", features: [] } })

      map.addLayer({
        id: "campus-route-line",
        type: "line",
        source: "campus-route",
        paint: {
          "line-color": "#0040E8",
          "line-width": 7,
          "line-opacity": 1,
          "line-dasharray": [0, 1000],
        },
      })

      map.addLayer(
        {
          id: "campus-route-outline",
          type: "line",
          source: "campus-route",
          paint: { "line-color": "#001a99", "line-width": 12, "line-opacity": 0.85 },
          layout: { "line-join": "round", "line-cap": "round" },
        },
        "campus-route-line",
      )

      map.addLayer({
        id: "campus-route-start-glow",
        type: "circle",
        source: "campus-route",
        filter: ["==", ["get", "type"], "start"],
        paint: {
          "circle-radius": 20,
          "circle-color": "#0040E8",
          "circle-opacity": 0.15,
        },
      })

      map.addLayer({
        id: "campus-route-start",
        type: "circle",
        source: "campus-route",
        filter: ["==", ["get", "type"], "start"],
        paint: {
          "circle-radius": 12,
          "circle-color": "#0040E8",
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 1,
        },
      })

      map.addLayer({
        id: "campus-route-end-glow",
        type: "circle",
        source: "campus-route",
        filter: ["==", ["get", "type"], "end"],
        paint: {
          "circle-radius": 20,
          "circle-color": "#0040E8",
          "circle-opacity": 0.15,
        },
      })

      map.addLayer({
        id: "campus-route-end",
        type: "circle",
        source: "campus-route",
        filter: ["==", ["get", "type"], "end"],
        paint: {
          "circle-radius": 12,
          "circle-color": "#0040E8",
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 1,
        },
      })

      console.log("[Campus] Map ready with hard outside mask, pro palette, lighting, and safe atmosphere.")
    })

    map.on("error", (e: any) => {
      const msg = String(e?.error?.message || e?.message || "")
      if (/pro-sky|type "?sky"?|missing required property "source"/i.test(msg)) {
        return
      }
      console.error("[Map] error", e?.error || e)
    })

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (mapRef.current) mapRef.current.remove()
      mapRef.current = null
      // @ts-ignore
      delete (window as any).__MAPDEBUG__
    }
  }, [clearSelection, directionsMode, navigationMode, selectingEndpoint])

  /* ========== Search Indexing ========== */
  function indexAllFeatures(buildings: any, outdoor: any) {
    const idx: IndexedFeature[] = []
    if (buildings?.features) {
      for (const f of buildings.features) {
        const p = f.properties || {}
        const name = p.name
        const altNames: string[] = []
        Object.keys(p).forEach((k) => {
          if (k.startsWith("name:")) altNames.push(p[k])
        })
        idx.push({
          id: `b:${p.id}`,
          source: "buildings",
          geometryType: f.geometry?.type,
          name,
          altNames,
          category: p.category,
          kind: "building",
          raw: f,
          center: centroid(f),
        } as any)
      }
    }
    if (outdoor?.features) {
      for (const f of outdoor.features) {
        const p = f.properties || {}
        const name = p.name
        const altNames: string[] = []
        Object.keys(p).forEach((k) => {
          if (k.startsWith("name:")) altNames.push(p[k])
        })
        idx.push({
          id: `o:${p["@id"] || p.id}`,
          source: "outdoor",
          geometryType: f.geometry?.type,
          name,
          altNames,
          category: p.__kind,
          kind: p.__kind,
          raw: f,
          center: centroid(f),
        })
      }
    }
    setIndexedFeatures(idx)
  }

  /* ========== Search Logic ========== */
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([])
      return
    }
    const q = searchQuery.trim().toLowerCase()
    const scored: { f: IndexedFeature; score: number }[] = []
    for (const f of indexedFeatures) {
      let best = 0
      if (f.name) best = Math.max(best, fuzzyScore(q, f.name))
      for (const alt of f.altNames) best = Math.max(best, fuzzyScore(q, alt))
      if (best > 0) scored.push({ f, score: best })
    }
    scored.sort((a, b) => b.score - a.score)
    setSearchResults(scored.slice(0, 8).map((s) => s.f))
    setSearchActiveIndex(0)
  }, [searchQuery, indexedFeatures])

  function flyToFeature(f: IndexedFeature) {
    const map = mapRef.current
    if (!map) return
    const [lon, lat] = f.center
    map.easeTo({ center: [lon, lat], zoom: 18.2, duration: 900, padding: UI_PADDING as any })
  }

  function makeSnappedEndpoint(coord: [number, number], label: string, featureId?: string): Endpoint {
    const snap = snapToGraph(coord)
    if (snap) {
      return {
        coord,
        routeCoord: snap.routeCoord,
        snapInfo: { nodeId: snap.nodeId, dist: snap.dist },
        label,
        featureId,
      }
    }
    return { coord, label, featureId }
  }

  function setEndpointFromCoord(coord: [number, number], label: string, featureId: string, isStart: boolean) {
    const ep = makeSnappedEndpoint(coord, label, featureId)
    if (isStart) {
      setStartPoint(ep)
      setSelectingEndpoint("end")
    } else {
      setEndPoint(ep)
      setSelectingEndpoint(null)
    }
  }

  function selectFeatureFromSearch(f: IndexedFeature) {
    const map = mapRef.current
    if (!map) return
    flyToFeature(f)
    if (selectedIdRef.current !== null) {
      if (map.getSource("campus-buildings"))
        map.setFeatureState({ source: "campus-buildings", id: selectedIdRef.current }, { selected: false })
      if (map.getSource("campus-outdoor"))
        map.setFeatureState({ source: "campus-outdoor", id: selectedIdRef.current }, { selected: false })
    }
    if (f.source === "buildings") {
      const idNum = f.raw.properties.id
      selectedIdRef.current = idNum
      map.setFeatureState({ source: "campus-buildings", id: idNum }, { selected: true })
      setSelected({
        id: idNum,
        name: f.name,
        category: f.raw.properties.category,
        levels: f.raw.properties.levels,
        source: f.raw.properties.source,
        featureId: idNum,
      })
    } else {
      const id = f.raw.properties["@id"] || f.raw.properties.id
      selectedIdRef.current = id
      map.setFeatureState({ source: "campus-outdoor", id }, { selected: true })
      setSelected({
        id,
        name: f.name,
        category: f.kind,
        source: "OSM",
        featureId: id,
      })
    }
    if (directionsMode && selectingEndpoint) {
      const ep = makeSnappedEndpoint(f.center, f.name || f.kind || "Feature", f.id)
      if (selectingEndpoint === "start") {
        setStartPoint(ep)
        setSelectingEndpoint("end")
      } else {
        setEndPoint(ep)
        setSelectingEndpoint(null)
      }
    }
    if (navigationMode) {
      setDestinationPoint(makeSnappedEndpoint(f.center, f.name || f.kind || "Destination", f.id))
      if (posState) {
        fetchRoute([posState.lon, posState.lat], destinationPoint?.routeCoord || f.center)
        routeStartRef.current = [posState.lon, posState.lat]
        lastRouteComputeRef.current = Date.now()
        lastProgressTraveledRef.current = 0
      }
    }
    setSearchOpen(false)
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSearchActiveIndex((i) => Math.min(i + 1, searchResults.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSearchActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      if (searchResults[searchActiveIndex]) selectFeatureFromSearch(searchResults[searchActiveIndex])
    } else if (e.key === "Escape") {
      setSearchOpen(false)
      setSearchQuery("")
    }
  }

  /* ========== Graph Snap Helper ========== */
  function snapToGraph(coord: [number, number]): { routeCoord: [number, number]; nodeId: number; dist: number } | null {
    if (!campusGraph) return null
    const nn = findNearestNode(campusGraph, coord[0], coord[1])
    if (!nn) return null
    if (nn.dist > BUILDING_SNAP_MAX) return null
    return {
      routeCoord: campusGraph.nodes[nn.id].coord as [number, number],
      nodeId: nn.id,
      dist: nn.dist,
    }
  }

  /* ========== Internal Routing Helpers ========== */
  function tryInternalRoute(
    start: [number, number],
    end: [number, number],
  ): { fc: GeoJSON.FeatureCollection; distance: number; duration: number; farSnap: boolean } | null {
    if (!campusGraph) {
      console.debug("[InternalRoute] campusGraph missing")
      return null
    }
    const a = findNearestNode(campusGraph, start[0], start[1])
    const b = findNearestNode(campusGraph, end[0], end[1])
    if (!a || !b) {
      console.debug("[InternalRoute] FAIL no snap", { a, b })
      return null
    }
    const maxDist = Math.max(a.dist, b.dist)
    let farSnap = false
    if (maxDist > INTERNAL_ROUTE_RELAXED_MAX) {
      console.debug("[InternalRoute] FAIL distances exceed relaxed max", {
        a: a.dist,
        b: b.dist,
        relaxed: INTERNAL_ROUTE_RELAXED_MAX,
      })
      return null
    }
    if (maxDist > INTERNAL_ROUTE_MAX_SNAP_METERS) {
      farSnap = true
      console.debug("[InternalRoute] Using relaxed snap (farSnap)", {
        a: a.dist,
        b: b.dist,
        strict: INTERNAL_ROUTE_MAX_SNAP_METERS,
      })
    }
    const sp = shortestPath(campusGraph, a.id, b.id)
    if (!sp || sp.path.length < 2) {
      console.debug("[InternalRoute] FAIL shortest path", { from: a.id, to: b.id })
      return null
    }
    const coords: [number, number][] = sp.path.map((id) => campusGraph.nodes[id].coord)
    const distance = sp.distance
    const duration = distance / DEFAULT_WALK_SPEED_MS
    return {
      fc: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "LineString", coordinates: coords },
            properties: {
              distance,
              duration,
              source: "internal-graph",
              snappedStartDist: a.dist,
              snappedEndDist: b.dist,
              farSnap,
            },
          },
        ],
      },
      distance,
      duration,
      farSnap,
    }
  }

  /* ========== Routing ========== */
  async function fetchOsrmRoute(start: [number, number], end: [number, number]) {
    setDirectionsStatus("Routing (OSRM)...")
    const url = `${OSRM_BASE}/route/v1/${ROUTE_PROFILE}/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&steps=true`
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      if (!data.routes || !data.routes.length) throw new Error("No route")
      const route = data.routes[0]
      const line: GeoJSON.Feature = {
        type: "Feature",
        geometry: route.geometry,
        properties: {
          distance: route.distance,
          duration: route.duration,
          source: "osrm",
        },
      }
      // Include destination point for dot marker
      const destPoint: GeoJSON.Feature = {
        type: "Feature",
        geometry: { type: "Point", coordinates: end },
        properties: { isDestination: true },
      }
      const fc: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [line, destPoint] }
      setRouteState({
        geojson: fc,
        distance: route.distance,
        duration: route.duration,
        fetched: true,
        steps: route.legs?.[0]?.steps || [],
      })
      setDirectionsStatus("Route ready")
      updateRouteSource(fc)
      fitRouteBounds(fc)
      setRouteProgress(null)
      console.debug("[Routing] OSRM fallback used")
    } catch (err: any) {
      console.warn("[Routing] OSRM failed, fallback to straight line", err)
      const distance = haversineM(start[1], start[0], end[1], end[0])
      const duration = distance / DEFAULT_WALK_SPEED_MS
      const line: GeoJSON.Feature = {
        type: "Feature",
        geometry: { type: "LineString", coordinates: [start, end] },
        properties: { distance, duration, source: "fallback" },
      }
      const fc: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [line] }
      setRouteState({
        geojson: fc,
        distance,
        duration,
        fetched: true,
        error: "Fallback line (OSRM error)",
      })
      setDirectionsStatus("Fallback route ready")
      updateRouteSource(fc)
      fitRouteBounds(fc)
      setRouteProgress(null)
    }
  }

  async function fetchRoute(start: [number, number], end: [number, number]) {
    // 🔥 CRITICAL FIX: Prevent concurrent route fetches
    if (isRoutingRef.current) {
      console.debug("[Routing] Already routing, skipping duplicate request")
      return
    }

    isRoutingRef.current = true

    try {
      console.debug("[Routing] Request", { start, end })
      setDirectionsStatus("Routing...")

      const internal = tryInternalRoute(start, end)
      if (internal) {
        setRouteState({
          geojson: internal.fc,
          distance: internal.distance,
          duration: internal.duration,
          fetched: true,
          steps: [],
        })
        setDirectionsStatus(
          internal.fc.features[0].properties?.farSnap ? "Internal route (relaxed snap)" : "Internal route ready",
        )
        updateRouteSource(internal.fc)
        fitRouteBounds(internal.fc)
        setRouteProgress(null)
        routeStartRef.current = start
        lastRouteComputeRef.current = Date.now()
        lastProgressTraveledRef.current = 0
        return
      }

      await fetchOsrmRoute(start, end)
      routeStartRef.current = start
      lastRouteComputeRef.current = Date.now()
      lastProgressTraveledRef.current = routeProgress?.traveled || 0
    } finally {
      // 🔥 CRITICAL: Always clear the flag, even if error
      isRoutingRef.current = false
    }
  }

  function animateRouteReveal() {
    const map = mapRef.current
    if (!map) return

    // Ensure dark blue color is locked before animation starts
    map.setPaintProperty("campus-route-line", "line-color", "#0040E8")
    map.setPaintProperty("campus-route-line", "line-opacity", 1)

    let progress = 0
    const duration = 2500 // 2.5 seconds
    const pathLength = 5000
    const startTime = Date.now()

    // Cubic easing for smooth deceleration
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const animate = () => {
      progress = Math.min((Date.now() - startTime) / duration, 1)
      const eased = easeOutCubic(progress)

      // Animate route with dash-array reveal
      const dashLength = pathLength * eased
      map.setPaintProperty("campus-route-line", "line-dasharray", [dashLength, pathLength - dashLength])

      // Animate start point growth and fade-in
      if (map.getLayer("campus-route-start")) {
        map.setPaintProperty("campus-route-start", "circle-radius", 6 + eased * 6)
        map.setPaintProperty("campus-route-start", "circle-opacity", eased)
        map.setPaintProperty("campus-route-start-glow", "circle-opacity", eased * 0.2)
      }

      // Animate end point growth and fade-in
      if (map.getLayer("campus-route-end")) {
        map.setPaintProperty("campus-route-end", "circle-radius", 6 + eased * 6)
        map.setPaintProperty("campus-route-end", "circle-opacity", eased)
        map.setPaintProperty("campus-route-end-glow", "circle-opacity", eased * 0.2)
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        map.setPaintProperty("campus-route-line", "line-dasharray", [0, 0])
        map.setPaintProperty("campus-route-line", "line-color", "#0040E8")
        map.setPaintProperty("campus-route-line", "line-opacity", 1)

        if (map.getLayer("campus-route-start")) {
          map.setPaintProperty("campus-route-start", "circle-radius", 12)
          map.setPaintProperty("campus-route-start", "circle-opacity", 1)
          map.setPaintProperty("campus-route-start-glow", "circle-opacity", 0.15)
        }
        if (map.getLayer("campus-route-end")) {
          map.setPaintProperty("campus-route-end", "circle-radius", 12)
          map.setPaintProperty("campus-route-end", "circle-opacity", 1)
          map.setPaintProperty("campus-route-end-glow", "circle-opacity", 0.15)
        }
      }
    }
    animate()
  }

  function updateRouteSource(fc: GeoJSON.FeatureCollection) {
    const map = mapRef.current
    if (!map) return

    const enrichedFeatures = [
      ...fc.features,
      startPoint
        ? {
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: startPoint.coord },
            properties: { type: "start" },
          }
        : null,
      endPoint
        ? {
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: endPoint.coord },
            properties: { type: "end" },
          }
        : null,
    ].filter(Boolean)

    const enrichedFC: GeoJSON.FeatureCollection = {
      ...fc,
      features: enrichedFeatures as any,
    }

    if (map.getSource("campus-route")) {
      ;(map.getSource("campus-route") as maplibregl.GeoJSONSource).setData(enrichedFC)
      // Start animation when route is updated
      animateRouteReveal()
    }
  }
  function clearRoute() {
    setRouteState({ geojson: null, distance: 0, duration: 0, fetched: false })
    setRouteProgress(null)
    setDirectionsStatus("Choose start & destination")
    const map = mapRef.current
    if (map?.getSource("campus-route")) {
      ;(map.getSource("campus-route") as maplibregl.GeoJSONSource).setData({ type: "FeatureCollection", features: [] })
    }
    routeStartRef.current = null
    lastRouteComputeRef.current = 0
    lastProgressTraveledRef.current = 0
  }

  function fitRouteBounds(fc: GeoJSON.FeatureCollection) {
    const map = mapRef.current
    if (!map) return
    const coords: [number, number][] = []
    fc.features.forEach((f) => {
      const g: any = f.geometry
      if (g.type === "LineString") coords.push(...g.coordinates)
      else if (g.type === "MultiLineString") g.coordinates.forEach((c: any) => coords.push(...c))
      // Include Point features for bounds calculation (like destination marker)
      else if (g.type === "Point") coords.push(g.coordinates)
    })
    if (!coords.length) return
    let minX = 999,
      minY = 999,
      maxX = -999,
      maxY = -999
    coords.forEach(([x, y]) => {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    })
    map.fitBounds(
      [
        [minX, minY],
        [maxX, maxY],
      ],
      { padding: UI_PADDING as any, maxZoom: 19 },
    )
  }

  function updateRouteProgress(pos: PositionState, route: RouteState) {
    if (!route.geojson || !route.geojson.features.length) return
    const lineFeature = route.geojson.features.find(
      (f) => f.geometry?.type === "LineString" || f.geometry?.type === "MultiLineString",
    )
    if (!lineFeature) return
    const line = lineFeature.geometry as any
    if (!line) return
    const coords: [number, number][] = line.type === "LineString" ? line.coordinates : line.coordinates.flat()
    if (coords.length < 2) return
    const segmentDistances: number[] = []
    let total = 0
    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i],
        b = coords[i + 1]
      const d = haversineM(a[1], a[0], b[1], b[0])
      total += d
      segmentDistances.push(total)
    }
    let minDist = Number.POSITIVE_INFINITY
    let traveledAtClosest = 0
    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i]
      const b = coords[i + 1]
      const proj = projectPointOnSegment(a, b, [pos.lon, pos.lat])
      const dPointSeg = haversineM(pos.lat, pos.lon, proj[1], proj[0])
      if (dPointSeg < minDist) {
        minDist = dPointSeg
        const segStartCumulative = i === 0 ? 0 : segmentDistances[i - 1]
        const segLen = haversineM(a[1], a[0], b[1], b[0])
        const part = segLen === 0 ? 0 : haversineM(a[1], a[0], proj[1], proj[0])
        traveledAtClosest = segStartCumulative + part
      }
    }
    const remaining = total - traveledAtClosest
    const speed = pos.speed && pos.speed > 0.5 ? pos.speed : DEFAULT_WALK_SPEED_MS
    const etaSeconds = remaining / speed
    setRouteProgress({ traveled: traveledAtClosest, remaining, etaSeconds })
  }

  function projectPointOnSegment(a: [number, number], b: [number, number], p: [number, number]): [number, number] {
    const ax = a[0],
      ay = a[1]
    const bx = b[0],
      by = b[1]
    const px = p[0],
      py = p[1]
    const dx = bx - ax,
      dy = by - ay
    const lengthSq = dx * dx + dy * dy
    if (lengthSq === 0) return a
    let t = ((px - ax) * dx + (py - ay) * dy) / lengthSq
    t = Math.max(0, Math.min(1, t))
    return [ax + t * dx, ay + t * dy]
  }

  // Add this ref at the top with your other refs

  // COMPLETELY REPLACE your navigation useEffect with this:
  useEffect(() => {
    // Clear any pending navigation updates
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current)
      navigationTimerRef.current = null
    }

    if (!navigationMode) return
    if (!destinationPoint) return
    if (!posState) return

    // 🔥 CRITICAL: Debounce ALL navigation logic by 500ms
    navigationTimerRef.current = setTimeout(() => {
      const destCoord = destinationPoint.routeCoord || destinationPoint.coord

      // Check distance
      const distToDest = haversineM(posState.lat, posState.lon, destCoord[1], destCoord[0])

      // Too far? Only initial route
      if (distToDest > MAX_NAVIGATION_DISTANCE) {
        if (!routeState.fetched && !isRoutingRef.current) {
          console.log("[Navigation] Far away, initial route only")
          fetchRoute([posState.lon, posState.lat], destCoord)
        }
        return
      }

      // Initial route
      if (!routeState.fetched && !isRoutingRef.current) {
        console.log("[Navigation] Initial route")
        fetchRoute([posState.lon, posState.lat], destCoord)
        return
      }

      if (!routeState.geojson) return
      if (isRoutingRef.current) return // Block if already routing

      // Check if we need reroute
      const now = Date.now()
      if (now - lastRerouteTimeRef.current < REROUTE_DEBOUNCE_MS) {
        return // Too soon since last reroute
      }

      const offDist = distanceFromPointToRoute([posState.lon, posState.lat], routeState.geojson)

      // Off route?
      if (offDist > OFF_ROUTE_DISTANCE_THRESHOLD) {
        console.log("[Navigation] Off route:", offDist.toFixed(1), "m")
        lastRerouteTimeRef.current = now
        fetchRoute([posState.lon, posState.lat], destCoord)
        return
      }

      // Progressed?
      if (routeProgress && routeProgress.traveled - lastProgressTraveledRef.current > RECOMPUTE_DISTANCE_THRESHOLD) {
        console.log(
          "[Navigation] Progressed:",
          (routeProgress.traveled - lastProgressTraveledRef.current).toFixed(1),
          "m",
        )
        lastRerouteTimeRef.current = now
        lastProgressTraveledRef.current = routeProgress.traveled
        fetchRoute([posState.lon, posState.lat], destCoord)
        return
      }
    }, 500) // 🔥 500ms debounce prevents race conditions

    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current)
      }
    }

    // 🔥 CRITICAL: ONLY depend on inputs, NOT outputs
  }, [navigationMode, destinationPoint, posState])

  function distanceFromPointToRoute(p: [number, number], fc: GeoJSON.FeatureCollection): number {
    let min = Number.POSITIVE_INFINITY
    for (const f of fc.features) {
      const g: any = f.geometry
      if (!g) continue
      if (g.type === "LineString") {
        min = Math.min(min, distancePointToLineString(p, g.coordinates))
      } else if (g.type === "MultiLineString") {
        for (const line of g.coordinates) {
          min = Math.min(min, distancePointToLineString(p, line))
        }
      }
    }
    return min
  }

  function distancePointToLineString(p: [number, number], coords: [number, number][]): number {
    if (coords.length < 2) return Number.POSITIVE_INFINITY
    let best = Number.POSITIVE_INFINITY
    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i]
      const b = coords[i + 1]
      const proj = projectPointOnSegment(a, b, p)
      const d = haversineM(p[1], p[0], proj[1], proj[0])
      if (d < best) best = d
    }
    return best
  }

  /* ========== UI Handlers ========== */
  function handleTrackClick() {
    if (!tracking) startTracking()
    else {
      setFollow((f) => !f)
      setGeoStatus((prev) => (follow ? "Tracking" : "Follow"))
    }
  }

  function handleStop() {
    stopTracking()
  }

  function onPressStart() {
    if (!tracking) return
    longPressTimer.current = window.setTimeout(() => {
      handleStop()
    }, 1200)
  }

  function onPressEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const buttonLabel = (() => {
    if (!tracking) return "Locate"
    if (tracking && follow) return "Following"
    if (tracking && !follow) return "Tracking"
    return "Locate"
  })()

  function toggleDirectionsMode() {
    const newVal = !directionsMode
    setDirectionsMode(newVal)
    if (!newVal) {
      setStartPoint(null)
      setEndPoint(null)
      setSelectingEndpoint(null)
      clearRoute()
    } else {
      if (navigationMode) {
        setNavigationMode(false)
        setDestinationPoint(null)
      }
      setSelectingEndpoint("start")
      setDirectionsStatus("Select Start (click map or search)")
    }
  }

  function toggleNavigationMode() {
    const newVal = !navigationMode
    setNavigationMode(newVal)
    if (!newVal) {
      setDestinationPoint(null)
      clearRoute()
    } else {
      if (directionsMode) {
        setDirectionsMode(false)
        setStartPoint(null)
        setEndPoint(null)
        setSelectingEndpoint(null)
      }
      setDirectionsStatus("Select a destination (search or click)")
    }
  }

  function setStartFromCurrent() {
    if (posState) {
      const coord: [number, number] = [posState.lon, posState.lat]
      const ep = makeSnappedEndpoint(coord, "My Location", "current")
      setStartPoint(ep)
      setSelectingEndpoint("end")
    }
  }

  function flyToStartEnd(point: Endpoint | null) {
    if (!point) return
    const map = mapRef.current
    if (!map) return
    map.easeTo({ center: point.coord, zoom: 18, duration: 700, padding: UI_PADDING as any })
  }

  const routeSummary = useMemo(() => {
    if (!routeState.fetched || !routeState.geojson) return null
    const distance = routeState.distance
    const duration = routeState.duration
    const base = `${formatDistance(distance)} · ${formatDuration(duration)}`
    if (routeProgress) {
      return `${base} | Remaining ${formatDistance(routeProgress.remaining)} · ETA ${formatDuration(routeProgress.etaSeconds)}`
    }
    return base
  }, [routeState, routeProgress])

  /* ========== Render ========== */
  return (
    <div className="w-full h-full relative bg-gradient-to-br from-slate-900 to-slate-950 font-sans overflow-hidden font-sfpro">
      <div ref={containerRef} className="w-full h-full" />
      

      {/* Search Bar - Premium centered input */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-50 w-96 max-w-[90%]"
      >
        <div
          className="rounded-xl p-2 backdrop-blur-xl border border-white/8 shadow-2xl"
          style={{ background: "rgba(15,18,25,0.8)" }}
        >
          <div className="flex gap-2 items-center">
            <Search className="w-4 h-4 text-cyan-400/60 flex-shrink-0 ml-2" />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSearchOpen(true)
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={
                navigationMode
                  ? destinationPoint
                    ? "Change destination..."
                    : "Search destination..."
                  : directionsMode
                    ? selectingEndpoint === "start"
                      ? "Search start point..."
                      : selectingEndpoint === "end"
                        ? "Search destination..."
                        : "Search..."
                    : "Search buildings, grounds, features..."
              }
              onFocus={() => setSearchOpen(true)}
              className="flex-1 bg-white/6 border border-white/12 text-cyan-50 placeholder-white/40 px-2 py-2 text-sm rounded-lg outline-none transition-all hover:border-white/16 focus:border-cyan-500/40 focus:bg-white/8"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchQuery("")
                setSearchResults([])
                setSearchOpen(false)
              }}
              className="bg-white/8 hover:bg-white/12 text-white/70 hover:text-white/90 border border-white/12 px-2 py-2 rounded-lg text-xs transition-all flex-shrink-0"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {searchOpen && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mt-2 bg-slate-900/95 border border-white/10 rounded-lg max-h-64 overflow-y-auto"
              >
                {searchResults.map((f, i) => {
                  const active = i === searchActiveIndex
                  return (
                    <motion.div
                      key={f.id}
                      onMouseDown={() => selectFeatureFromSearch(f)}
                      onMouseEnter={() => setSearchActiveIndex(i)}
                      className={`px-3 py-2 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0 transition-all ${
                        active
                          ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                          : "hover:bg-white/8 text-white/80"
                      }`}
                      whileHover={{ paddingLeft: "16px" }}
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-sm">
                        {f.kind === "water" ? "💧" : f.kind === "ground" ? "🏟" : f.kind === "building" ? "🏢" : "📍"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{f.name || f.kind || "Feature"}</div>
                        <div className="text-xs opacity-70">{f.category || f.kind || f.source}</div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Left Controls Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="absolute top-3 left-3 z-40 flex flex-col gap-2"
      >
        {/* Mode Buttons */}
        <div className="flex flex-col gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleDirectionsMode}
            className={`rounded-lg px-3 py-2 text-sm font-medium border transition-all flex items-center gap-2 ${
              directionsMode
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400/30 text-white shadow-lg shadow-cyan-500/20"
                : "bg-gradient-to-r from-slate-700 to-slate-800 border-white/10 text-white/80 hover:text-white/90"
            }`}
            title="Manual directions (pick start & end)"
          >
            <Route className="w-4 h-4" />
            {directionsMode ? "Directions" : "Route"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleNavigationMode}
            className={`rounded-lg px-3 py-2 text-sm font-medium border transition-all flex items-center gap-2 ${
              navigationMode
                ? "bg-gradient-to-r from-cyan-600 to-teal-600 border-cyan-400/30 text-white shadow-lg shadow-cyan-500/20"
                : "bg-gradient-to-r from-slate-700 to-slate-800 border-white/10 text-white/80 hover:text-white/90"
            }`}
            title="Navigate from current location"
          >
            <Compass className="w-4 h-4" />
            {navigationMode ? "Navigate" : "Nav"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const m = mapRef.current
              if (!m) return
              toggle3D(m)
              setThreeDFlag((prev) => !prev)
            }}
            className={`rounded-lg px-3 py-2 text-sm font-medium border transition-all flex items-center gap-2 ${
              threeDFlag
                ? "bg-gradient-to-r from-slate-800 to-slate-900 border-white/10 text-white/80"
                : "bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400/30 text-white"
            }`}
            title="Toggle 2D / 3D view"
          >
            <Layers className="w-4 h-4" />
            {threeDFlag ? "2D" : "3D"}
          </motion.button>
        </div>

        {/* Directions Panel */}
        <AnimatePresence>
          {directionsMode && (
            <motion.div
              initial={{ opacity: 0, x: -12, y: 8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -12, y: 8 }}
              transition={{ duration: 0.3 }}
              className="w-72 rounded-xl p-4 border border-white/12 backdrop-blur-2xl shadow-2xl"
              style={{ background: "rgba(15,18,25,0.9)" }}
            >
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Route className="w-5 h-5 text-cyan-400" />
                Route Planning
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wide">Start Point</label>
                  <div className="flex gap-2 mt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectingEndpoint("start")}
                      className={`flex-1 text-left rounded-lg px-3 py-2 text-sm transition-all border ${
                        selectingEndpoint === "start"
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-400/30 text-white"
                          : "bg-white/8 border-white/12 text-white/70 hover:bg-white/12"
                      }`}
                    >
                      {startPoint ? startPoint.label : "Pick point"}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={setStartFromCurrent}
                      title="Use current location"
                      className="bg-white/8 hover:bg-white/12 border border-white/12 rounded-lg px-3 py-2 text-cyan-400"
                    >
                      <MapPin className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wide">Destination</label>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectingEndpoint("end")}
                    className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-all border mt-2 ${
                      selectingEndpoint === "end"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-400/30 text-white"
                        : "bg-white/8 border-white/12 text-white/70 hover:bg-white/12"
                    }`}
                  >
                    {endPoint ? endPoint.label : "Pick destination"}
                  </motion.button>
                </div>

                <div className="flex gap-2 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (startPoint && endPoint)
                        fetchRoute(startPoint.routeCoord || startPoint.coord, endPoint.routeCoord || endPoint.coord)
                    }}
                    disabled={!startPoint || !endPoint}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      !startPoint || !endPoint
                        ? "bg-white/10 border border-white/12 text-white/40 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600 to-emerald-600 border border-green-400/30 text-white hover:shadow-lg hover:shadow-green-500/20"
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    Route
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setStartPoint(null)
                      setEndPoint(null)
                      setSelectingEndpoint("start")
                    }}
                    className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Route Info */}
                {routeState.fetched && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-3 rounded-lg bg-white/6 border border-white/10"
                  >
                    <div className="text-sm font-medium text-cyan-300 mb-2">{routeSummary}</div>
                    <div className="text-xs text-white/50">{routeState.geojson?.features[0].properties?.source}</div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Panel */}
        <AnimatePresence>
          {navigationMode && (
            <motion.div
              initial={{ opacity: 0, x: -12, y: 8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -12, y: 8 }}
              transition={{ duration: 0.3 }}
              className="w-72 rounded-xl p-4 border border-white/12 backdrop-blur-2xl shadow-2xl"
              style={{ background: "rgba(15,18,25,0.9)" }}
            >
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-cyan-400" />
                Live Navigation
              </h3>
              <div className="space-y-4">
                <div className="text-sm text-white/70">
                  {destinationPoint ? destinationPoint.label : "(Select destination)"}
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!posState || !destinationPoint}
                    onClick={() => {
                      if (posState && destinationPoint) {
                        fetchRoute([posState.lon, posState.lat], destinationPoint.routeCoord || destinationPoint.coord)
                      }
                    }}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      !posState || !destinationPoint
                        ? "bg-white/10 border border-white/12 text-white/40 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600 to-emerald-600 border border-green-400/30 text-white hover:shadow-lg hover:shadow-green-500/20"
                    }`}
                  >
                    Re-route
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setDestinationPoint(null)
                      clearRoute()
                    }}
                    className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-lg px-3 py-2 font-medium transition-all"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
                {routeState.fetched && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-3 rounded-lg bg-white/6 border border-white/10 text-sm text-cyan-300"
                  >
                    {routeSummary}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Hover HUD - Top Left */}
      <AnimatePresence>
        {hoverInfo && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="absolute top-16 left-3 p-3 rounded-lg bg-slate-900/70 border border-white/12 backdrop-blur-xl text-white/90 text-sm max-w-xs pointer-events-none z-10"
          >
            <div className="font-semibold">{hoverInfo.name || "Feature"}</div>
            <div className="text-xs text-white/60 mt-1">
              {hoverInfo.category || "Unknown"}
              {hoverInfo.levels != null ? ` · Levels: ${hoverInfo.levels}` : ""}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend - Bottom Left */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute left-3 bottom-3 min-w-40 p-4 rounded-xl border border-white/12 backdrop-blur-2xl shadow-2xl z-10 max-h-64 overflow-y-auto"
        style={{ background: "rgba(15,18,25,0.85)" }}
      >
        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Map className="w-4 h-4 text-cyan-400" />
          Categories
        </h4>
        <div className="space-y-2 text-xs">
          {legendCats.length === 0 ? (
            <span className="text-white/40">Loading...</span>
          ) : (
            legendCats.map((cat) => {
              const color = CATEGORY_COLORS[cat] || DEFAULT_CATEGORY_COLOR
              return (
                <motion.div
                  key={cat}
                  whileHover={{ paddingLeft: "8px" }}
                  className="flex items-center gap-2 text-white/80 transition-all"
                >
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0 shadow-lg"
                    style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
                  />
                  <span>{cat}</span>
                </motion.div>
              )
            })
          )}
        </div>
      </motion.div>

      {/* Selection Panel - Top Right */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: -12 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, y: -12 }}
            className="absolute top-16 right-3 w-80 p-4 rounded-xl border border-white/12 backdrop-blur-2xl shadow-2xl z-20"
            style={{ background: "rgba(15,18,25,0.9)" }}
          >
            <div className="flex justify-between items-start gap-3 mb-4">
              <h3 className="font-semibold text-white text-lg">{selected.name || "Feature"}</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => clearSelection(mapRef.current!)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="space-y-2 text-sm text-white/70">
              <div className="flex justify-between">
                <span className="text-white/50">Category</span>
                <span className="text-white/90">{selected.category || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Levels</span>
                <span className="text-white/90">{selected.levels ?? "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Source</span>
                <span className="text-white/90">{selected.source || "Unknown"}</span>
              </div>
            </div>

            {routeState.fetched && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-3 rounded-lg bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30"
              >
                <div className="text-xs font-semibold text-cyan-300 mb-1">Active Route</div>
                <div className="text-xs text-cyan-200">{routeSummary}</div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tracking Button - Bottom Right */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute bottom-3 right-3 z-30 flex flex-col items-end gap-2"
      >
        <motion.div
          onClick={handleTrackClick}
          onMouseDown={onPressStart}
          onMouseUp={onPressEnd}
          onMouseLeave={onPressEnd}
          onTouchStart={onPressStart}
          onTouchEnd={onPressEnd}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`cursor-pointer rounded-xl px-4 py-3 font-medium border transition-all shadow-lg user-select-none min-w-32 text-center ${
            tracking
              ? follow
                ? "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-400/30 text-white shadow-blue-500/30"
                : "bg-gradient-to-r from-slate-700 to-slate-800 border-white/12 text-white/80 shadow-slate-900/50"
              : "bg-gradient-to-r from-slate-800 to-slate-900 border-white/12 text-white/60 shadow-slate-900/50"
          }`}
          title={
            !tracking
              ? "Click to start GPS tracking"
              : follow
                ? "Click to disable follow. Long press to stop."
                : "Click to enable follow. Long press to stop."
          }
        >
          <div className="flex items-center justify-center gap-2">
            <LocateFixed className="w-4 h-4" />
            <span className="text-sm font-medium">{buttonLabel}</span>
          </div>
          <div className="text-xs text-white/50 mt-1">
            {geoStatus}
            {posState ? ` ± ${Math.round(posState.accuracy)}m` : ""}
          </div>
        </motion.div>

        <AnimatePresence>
          {tracking && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={handleStop}
              className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-lg px-3 py-2 text-sm font-medium transition-all"
              title="Stop GPS tracking"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
