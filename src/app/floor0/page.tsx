"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";


import SearchableSelect from "../components/searchable-select";
import LocationSearch from "../components/location-search";
import RouteInfo from "../components/route-info";
import RouteMap from "../components/route-map";
import TurnByTurn from "../components/turn-by-turn";
import { Zap, Cable as Cube } from "lucide-react";
import { shortestPathFloor0 as shortestPath } from "../lib/floor0Graph";
import { floor0Points } from '../lib/floor0Points';

// Only points with a visible name
const namedPoints = floor0Points.filter(
  (p) => p.tag && p.tag.trim().length > 0
);

const MAP_WIDTH = 1280;
const MAP_HEIGHT = 1920;
const UNIT_TO_METERS = 0.355;
const WALKING_SPEED_MS = 1.4;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: ["easeOut"] },
  },
};

function indexOfPoint(path: number[], pointId: number | null): number {
  if (pointId == null) return -1;
  return path.indexOf(pointId);
}

export default function Floor0Navigation() {
  const [startId, setStartId] = useState<number>(1);
  const [endId, setEndId] = useState<number>(8); // default example

  const [path, setPath] = useState<number[]>([]);
  const [isComputing, setIsComputing] = useState(false);

  const [currentIndexOnPath, setCurrentIndexOnPath] = useState<number>(0);

  const [livePointId, setLivePointId] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [show3D, setShow3D] = useState(false);

  const handleComputeRoute = async () => {
    const effectiveStart = livePointId ?? startId;

    if (effectiveStart === endId) {
      setPath([effectiveStart]);
      setCurrentIndexOnPath(0);
      return;
    }

    setIsComputing(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const p = shortestPath(effectiveStart, endId);
    setPath(p);

    setCurrentIndexOnPath(0);

    setIsComputing(false);
  };

  const handleLocateMe = async () => {
    try {
      setIsLocating(true);

      const fpRes = await fetch("http://localhost:5000/fingerprint");
      if (!fpRes.ok) {
        throw new Error(
          `Fingerprint helper error: HTTP ${fpRes.status} ${fpRes.statusText}`
        );
      }

      const fpData = (await fpRes.json()) as { aps?: Record<string, number> };
      console.log("Local Wi‑Fi fingerprint (floor 0):", fpData);

      if (!fpData.aps || Object.keys(fpData.aps).length === 0) {
        alert(
          "No Wi‑Fi data found from helper.\nMake sure Wi‑Fi is ON and the IndoorLocator helper has access."
        );
        return;
      }

      const res = await fetch("/api/locate?floor=0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aps: fpData.aps }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Locate API error:", res.status, text);
        throw new Error("Locate API failed");
      }

      const data = await res.json();
      if (data?.estimatedPoint) {
        setLivePointId((prev) =>
          prev === data.estimatedPoint ? prev : data.estimatedPoint
        );
      } else {
        alert(
          data?.error || "Could not estimate location from Wi‑Fi fingerprint"
        );
      }
    } catch (err) {
      console.error("LocateMe error:", err);
      alert(
        "Error while estimating location.\nIs the IndoorLocator helper running on this device?"
      );
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (livePointId == null || endId == null) return;
    if (path.length === 0) {
      const p = shortestPath(livePointId, endId);
      setPath(p);
      setCurrentIndexOnPath(0);
      return;
    }

    const idx = indexOfPoint(path, livePointId);

    if (idx >= 0) {
      setCurrentIndexOnPath((prev) => (idx > prev ? idx : prev));
      return;
    }

    const newPath = shortestPath(livePointId, endId);
    setPath(newPath);
    setCurrentIndexOnPath(0);
  }, [livePointId, endId, path]);

  useEffect(() => {
    if (!endId) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (cancelled) return;
      try {
        const fpRes = await fetch("http://localhost:5000/fingerprint");
        if (!fpRes.ok) return;

        const fpData = (await fpRes.json()) as { aps?: Record<string, number> };
        if (!fpData.aps || Object.keys(fpData.aps).length === 0) return;

        const res = await fetch("/api/locate?floor=0", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aps: fpData.aps }),
        });
        if (!res.ok) return;

        const data = await res.json();
        if (data?.estimatedPoint && !cancelled) {
          setLivePointId((prev) =>
            prev === data.estimatedPoint ? prev : data.estimatedPoint
          );
        }
      } catch {
      } finally {
        if (!cancelled) {
          timeoutId = setTimeout(poll, 3000);
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [endId]);

  const visiblePath = useMemo(() => {
    if (path.length === 0) return [];
    if (currentIndexOnPath <= 0) return path;
    return path.slice(currentIndexOnPath);
  }, [path, currentIndexOnPath]);

  const { distanceMeters, estimatedTimeSeconds } = useMemo(() => {
    let totalDistance = 0;
    const p = visiblePath.length > 0 ? visiblePath : path;

    for (let i = 0; i < p.length - 1; i++) {
      const point1 = floor0Points.find((pt) => pt.id === p[i]);
      const point2 = floor0Points.find((pt) => pt.id === p[i + 1]);

      if (point1 && point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        const manualDistance = Math.sqrt(dx * dx + dy * dy);
        totalDistance += manualDistance;
      }
    }

    const distanceMeters = totalDistance * UNIT_TO_METERS;
    const estimatedTimeSeconds = distanceMeters / WALKING_SPEED_MS;

    return { distanceMeters, estimatedTimeSeconds };
  }, [path, visiblePath]);

  const pathPoints = useMemo(
    () =>
      visiblePath
        .map((id) => floor0Points.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map((p) => ({ fx: p.fx, fy: p.fy })),
    [visiblePath]
  );

  const startPoint = floor0Points.find((p) => p.id === startId);
  const endPoint = floor0Points.find((p) => p.id === endId);

  return (
    <div className="h-screen w-full flex gap-6 font-sfpro bg-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      {/* Left Panel */}
      <motion.div
        initial={{ x: -400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-96 flex flex-col rounded-2xl font-sfpro border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <motion.div
          className="p-6 border-slate-200 dark:border-slate-800 bg-indigo-200 dark:from-slate-800 dark:to-slate-800"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <motion.div
              className="p-2 bg-blue-600 rounded-lg shadow-lg"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <Zap size={20} className="text-white" />
            </motion.div>
            <h1 className="text-2xl font-sfpro font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              Navigator
            </h1>
          </div>
          <p className="text-base text-slate-500 font-sfpro tracking-[-0.04em] font-medium dark:text-slate-400 ml-12">
            Floor 0 Routing
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <LocationSearch onSelectStart={setStartId} onSelectEnd={setEndId} />
          </motion.div>

          {/* Start Location (manual) */}
          <motion.div variants={itemVariants} className="bg-green-300">
            <label className="block text-xs bg-green-300 font-bold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">
              From
              {livePointId != null && (
                <span className="ml-2 text-[10px] font-normal text-green-800">
                  (using live location: point {livePointId})
                </span>
              )}
            </label>
            <SearchableSelect
              value={startId}
              onChange={setStartId}
              points={namedPoints}
              placeholder="Select start location"
            />
          </motion.div>

          {/* End Location */}
          <motion.div variants={itemVariants}>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">
              To
            </label>
            <SearchableSelect
              value={endId}
              onChange={setEndId}
              points={namedPoints}
              placeholder="Select end location"
            />
          </motion.div>

          {/* Compute Route */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={handleComputeRoute}
              disabled={isComputing || startId === endId}
              className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2 border-0"
            >
              {isComputing ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  />
                  <span>Computing...</span>
                </>
              ) : (
                <>
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Zap size={18} />
                  </motion.div>
                  <span>Compute Route</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Locate Me button */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className="w-full mt-2 py-2 px-4 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2 border border-blue-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLocating ? "Locating..." : "Locate Me (Wi‑Fi)"}
            </button>
          </motion.div>

          {/* Route Info Cards */}
          {path.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <RouteInfo
                  distance={distanceMeters}
                  estimatedTime={estimatedTimeSeconds}
                  nodeCount={visiblePath.length || path.length}
                  startPoint={startPoint}
                  endPoint={endPoint}
                />

                {/* Turn-by-Turn Instructions */}
                <motion.div variants={itemVariants} className="mt-5">
                  <TurnByTurn
                    path={visiblePath.length ? visiblePath : path}
                    pathPoints={pathPoints}
                    points={floor0Points}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {path.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-center py-8 text-slate-500 dark:text-slate-400"
            >
              <p className="text-sm">
                Select start and end points, then compute route
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Right Panel - Map with 3D Toggle */}
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-1 bg-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <motion.div
          className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {show3D ? "3D Preview" : "2D Map View"}
          </span>

          <motion.button
            onClick={() => setShow3D(!show3D)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              show3D
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            <motion.div
              animate={{ rotate: show3D ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Cube size={18} />
            </motion.div>
            <span className="text-xs uppercase tracking-wide font-bold">
              {show3D ? "2D Map" : "3D View"}
            </span>
          </motion.button>
        </motion.div>

        <div className="flex-1 w-full overflow-auto relative">
          {/* 2D Map View */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: show3D ? 0 : 1 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={`absolute inset-0 w-full h-full ${
              show3D ? "pointer-events-none" : "pointer-events-auto"
            }`}
          >
            <div className="w-full h-full pt-6 pb-6 px-4 overflow-auto">
              <div className="inline-block">
                <RouteMap
                  mapWidth={MAP_WIDTH}
                  mapHeight={MAP_HEIGHT}
                  path={visiblePath.length ? visiblePath : path}
                  pathPoints={(visiblePath.length ? visiblePath : path)
                    .map((id) => floor0Points.find((p) => p.id === id))
                    .filter((p): p is NonNullable<typeof p> => Boolean(p))
                    .map((p) => ({ x: p.fx, y: p.fy }))}
                  startId={startId}
                  endId={endId}
                  livePointId={livePointId}
                  points={floor0Points}
                  backgroundImageUrl="/floor0.svg"
                />
              </div>
            </div>
          </motion.div>

          {/* 3D Preview View (optional; can be blank for floor 0) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: show3D ? 1 : 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={`absolute inset-0 w-full h-full ${
              show3D ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              <div className="text-center text-slate-500 dark:text-slate-400">
                <Cube size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">3D View Coming Soon</p>
                <p className="text-sm mt-2">Floor 0 3D preview not yet available</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}