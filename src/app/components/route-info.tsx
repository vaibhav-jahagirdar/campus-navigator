"use client"

import { motion, type Variants } from "framer-motion"
import { Clock, Footprints, MapPin } from "lucide-react"

interface RouteInfoProps {
  distance: number
  estimatedTime: number
  nodeCount: number
  startPoint?: any
  endPoint?: any
}

const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(2)}km`
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${minutes}m ${secs}s`
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
  hover: {
    y: -4,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.3 },
  },
}

export default function RouteInfo({ distance, estimatedTime, nodeCount, startPoint, endPoint }: RouteInfoProps) {
  return (
    <div className="space-y-3 font-sfpro">
      {/* Distance Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700/50 shadow-sm cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ rotate: 20, scale: 1.1 }} transition={{ duration: 0.3 }}>
              <Footprints size={18} className="text-blue-600 dark:text-blue-400" />
            </motion.div>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
              Distance
            </span>
          </div>
          <motion.span
            className="text-xl font-bold text-blue-600 dark:text-blue-400"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {formatDistance(distance)}
          </motion.span>
        </div>
      </motion.div>

      {/* Time Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-700/50 shadow-sm cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ rotate: -20, scale: 1.1 }} transition={{ duration: 0.3 }}>
              <Clock size={18} className="text-indigo-600 dark:text-indigo-400" />
            </motion.div>
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
              Est. Time
            </span>
          </div>
          <motion.span
            className="text-xl font-bold text-indigo-600 dark:text-indigo-400"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {formatTime(estimatedTime)}
          </motion.span>
        </div>
      </motion.div>

      {/* Nodes Info */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 p-4 rounded-xl border border-cyan-200 dark:border-cyan-700/50 shadow-sm cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.3 }}>
              <MapPin size={18} className="text-cyan-600 dark:text-cyan-400" />
            </motion.div>
            <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wide">
              Waypoints
            </span>
          </div>
          <motion.span
            className="text-xl font-bold text-cyan-600 dark:text-cyan-400"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            {nodeCount}
          </motion.span>
        </div>
      </motion.div>

      {/* Route Summary */}
      {startPoint && endPoint && (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
            Route
          </div>
          <div className="space-y-2">
            <motion.div
              className="flex items-start gap-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <motion.div
                className="w-3 h-3 rounded-full bg-green-500 mt-1.5 flex-shrink-0"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              />
              <div className="text-sm text-slate-700 dark:text-slate-300">
                <div className="font-semibold">{startPoint?.tag}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Start</div>
              </div>
            </motion.div>
            <div className="h-6 border-l-2 border-slate-300 dark:border-slate-600 ml-1.5" />
            <motion.div
              className="flex items-start gap-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <motion.div
                className="w-3 h-3 rounded-full bg-red-500 mt-1.5 flex-shrink-0"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.3 }}
              />
              <div className="text-sm text-slate-700 dark:text-slate-300">
                <div className="font-semibold">{endPoint?.tag}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Destination</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
