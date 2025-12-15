"use client"

import { useEffect, useRef, useMemo } from "react"

type FloorPoint = {
  id: number
  x: number
  y: number
  fx: number
  fy: number
  tag: string
}

type RouteMapProps = {
  mapWidth: number
  mapHeight: number
  path: number[]
  pathPoints: { x: number; y: number }[]
  startId: number
  endId: number
  livePointId?: number | null
  // NEW: make component reusable
  points: FloorPoint[]                // pass floor1Points or floor2Points
  backgroundImageUrl: string          // e.g. "/1stfloorfinal.svg" or "/2ndfloorfinal.svg"
}

export default function RouteMap({
  mapWidth,
  mapHeight,
  path,
  pathPoints,
  startId,
  endId,
  livePointId,
  points,
  backgroundImageUrl,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const pathLineRef = useRef<SVGPathElement>(null)

  // Create smooth curved path using Catmull-Rom spline
  const smoothedPath = useMemo(() => {
    if (pathPoints.length < 2) return ""

    let pathD = `M ${pathPoints[0].x} ${pathPoints[0].y}`

    if (pathPoints.length === 2) {
      pathD += ` L ${pathPoints[1].x} ${pathPoints[1].y}`
    } else {
      for (let i = 0; i < pathPoints.length - 1; i++) {
        const p0 = pathPoints[Math.max(0, i - 1)]
        const p1 = pathPoints[i]
        const p2 = pathPoints[i + 1]
        const p3 = pathPoints[Math.min(pathPoints.length - 1, i + 2)]

        const cp1x = p1.x + (p2.x - p0.x) / 6
        const cp1y = p1.y + (p2.y - p0.y) / 6
        const cp2x = p2.x - (p3.x - p1.x) / 6
        const cp2y = p2.y - (p3.y - p1.y) / 6

        pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
      }
    }

    return pathD
  }, [pathPoints])

  // Animate path drawing on load
  useEffect(() => {
    if (pathLineRef.current && path.length > 0) {
      const length = pathLineRef.current.getTotalLength()
      pathLineRef.current.style.strokeDasharray = `${length}`
      pathLineRef.current.style.strokeDashoffset = `${length}`

      setTimeout(() => {
        if (pathLineRef.current) {
          pathLineRef.current.style.transition = "stroke-dashoffset 1.2s ease-out"
          pathLineRef.current.style.strokeDashoffset = "0"
        }
      }, 100)
    }
  }, [path])

  // Use passed points (not hardcoded floor2)
  const allPoints = points.map((p) => ({
    id: p.id,
    x: p.fx,
    y: p.fy,
    tag: p.tag,
  }))

  const startPoint = points.find((p) => p.id === startId)
  const endPoint = points.find((p) => p.id === endId)

  const livePoint =
    livePointId != null ? points.find((p) => p.id === livePointId) : null

  return (
    <div
      ref={containerRef}
      className="w-full font-sfpro h-full overflow-auto flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800"
    >
      <svg
        ref={svgRef}
        width={mapWidth}
        height={mapHeight}
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        className="drop-shadow-2xl"
      >
        <image
          href={backgroundImageUrl}
          x={0}
          y={0}
          width={mapWidth}
          height={mapHeight}
          opacity={0.95}
        />

        {/* Defs for gradients and filters */}
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="1" />
          </linearGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* All nodes - subtle */}
        {allPoints.map((p) => (
          <circle
            key={`all-${p.id}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="rgba(148, 163, 184, 0.4)"
            opacity={0.5}
          />
        ))}

        {/* Route polyline - smooth curved path */}
        {smoothedPath && pathPoints.length > 1 && (
          <>
            {/* Shadow/glow effect */}
            <path
              d={smoothedPath}
              fill="none"
              stroke="rgba(59, 130, 246, 0.2)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
            {/* Main route */}
            <path
              ref={pathLineRef}
              d={smoothedPath}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#softShadow)"
            />
          </>
        )}

        {/* Waypoints along the path */}
        {pathPoints.map((p, i) => {
          const isStart = i === 0
          const isEnd = i === pathPoints.length - 1

          if (isStart || isEnd) return null

          return (
            <g key={`waypoint-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r="8"
                fill="rgba(59, 130, 246, 0.2)"
                className="animate-pulse"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
                filter="url(#softShadow)"
              />
            </g>
          )
        })}

        {/* Start pin */}
        {startPoint && pathPoints.length > 0 && (
          <g>
            <circle
              cx={pathPoints[0].x}
              cy={pathPoints[0].y}
              r="14"
              fill="rgba(34, 197, 94, 0.2)"
              filter="url(#softShadow)"
            />
            <circle
              cx={pathPoints[0].x}
              cy={pathPoints[0].y}
              r="8"
              fill="#22c55e"
              stroke="white"
              strokeWidth="3"
            />
            <text
              x={pathPoints[0].x}
              y={pathPoints[0].y - 20}
              textAnchor="middle"
              className="text-xs font-bold fill-slate-900 dark:fill-white"
              style={{ fontSize: "12px" }}
            >
              Start
            </text>
          </g>
        )}

        {/* End pin */}
        {endPoint && pathPoints.length > 0 && (
          <g>
            <circle
              cx={pathPoints[pathPoints.length - 1].x}
              cy={pathPoints[pathPoints.length - 1].y}
              r="14"
              fill="rgba(239, 68, 68, 0.2)"
              filter="url(#softShadow)"
            />
            <circle
              cx={pathPoints[pathPoints.length - 1].x}
              cy={pathPoints[pathPoints.length - 1].y}
              r="8"
              fill="#ef4444"
              stroke="white"
              strokeWidth="3"
            />
            <text
              x={pathPoints[pathPoints.length - 1].x}
              y={pathPoints[pathPoints.length - 1].y - 20}
              textAnchor="middle"
              className="text-xs font-bold fill-slate-900 dark:fill-white"
              style={{ fontSize: "12px" }}
            >
              End
            </text>
          </g>
        )}

        {/* Live location blue dot */}
        {livePoint && (
          <g>
            <circle
              cx={livePoint.fx}
              cy={livePoint.fy}
              r={18}
              fill="rgba(59, 130, 246, 0.25)"
              filter="url(#glow)"
            />
            <circle
              cx={livePoint.fx}
              cy={livePoint.fy}
              r={10}
              fill="#2563eb"
              stroke="white"
              strokeWidth={3}
            />
          </g>
        )}
      </svg>
    </div>
  )
}