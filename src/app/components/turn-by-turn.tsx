"use client"

import { motion, Variants } from "framer-motion"
import { ChevronRight, ArrowUpRight, ArrowUpLeft, ArrowUp } from "lucide-react"

type FloorPoint = {
  id: number
  x: number
  y: number
  fx: number
  fy: number
  tag: string
}

interface TurnByTurnProps {
  path: number[]
  pathPoints: Array<{ fx: number; fy: number }>
  points: FloorPoint[] // NEW: pass floor1Points or floor2Points
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: ["easeOut"] },
  },
  hover: {
    x: 4,
    backgroundColor: "rgba(59, 130, 246, 0.05)",
    transition: { duration: 0.2 },
  },
}

export default function TurnByTurn({ path, pathPoints, points }: TurnByTurnProps) {
  const getTurnDirection = (
    p0: { fx: number; fy: number } | undefined,
    p1: { fx: number; fy: number } | undefined,
    p2: { fx: number; fy: number } | undefined,
  ): "left" | "right" | "straight" => {
    if (!p0 || !p1 || !p2) return "straight"

    const v1x = p1.fx - p0.fx
    const v1y = p1.fy - p0.fy
    const v2x = p2.fx - p1.fx
    const v2y = p2.fy - p1.fy

    const cross = v1x * v2y - v1y * v2x

    if (Math.abs(cross) < 10) return "straight"
    return cross > 0 ? "left" : "right"
  }

  const getTurnIcon = (direction: "left" | "right" | "straight") => {
    switch (direction) {
      case "left":
        return <ArrowUpLeft size={16} className="text-blue-500" />
      case "right":
        return <ArrowUpRight size={16} className="text-blue-500" />
      default:
        return <ArrowUp size={16} className="text-blue-500" />
    }
  }

  const steps = path.map((id, index) => {
    const point = points.find((p) => p.id === id)
    const direction = getTurnDirection(
      pathPoints[index - 1],
      pathPoints[index],
      pathPoints[index + 1],
    )

    return { id, point, direction, index }
  })

  return (
    <div className="bg-slate-100 dark:bg-slate-800/50 p-4 font-sfpro rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <motion.div
        className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        Turn-by-turn ({steps.length} stops)
      </motion.div>

      <motion.div
        className="space-y-2 max-h-64 overflow-y-auto pr-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {steps.map((step) => (
          <motion.div
            key={step.id}
            variants={itemVariants}
            whileHover="hover"
            className="flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer group border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
          >
            <motion.div
              className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm"
              whileHover={{ scale: 1.15, rotate: 360 }}
              transition={{ duration: 0.4 }}
            >
              {step.index + 1}
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {step.point?.tag ?? `Point ${step.id}`}
              </div>
              <motion.div
                className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5"
                initial={{ opacity: 0.7 }}
                whileHover={{ opacity: 1 }}
              >
                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                  {getTurnIcon(step.direction)}
                </motion.div>
                <span>
                  {step.direction === "left" && "Turn left"}
                  {step.direction === "right" && "Turn right"}
                  {step.direction === "straight" && "Continue straight"}
                </span>
              </motion.div>
            </div>

            <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
              <ChevronRight
                size={16}
                className="text-slate-300 dark:text-slate-600 flex-shrink-0 group-hover:text-blue-500 transition-colors"
              />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}