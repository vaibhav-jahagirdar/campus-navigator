"use client"

import { motion, type Variants } from "framer-motion"
import { useRouter } from "next/navigation"
import { Building2, ChevronRight } from "lucide-react"

const floors = [
  { id: 0, title: "Ground Floor", subtitle: "Navigate", number: "G" },
  { id: 1, title: "First Floor", subtitle: "Navigate", number: "1" },
  { id: 2, title: "Second Floor", subtitle: "Navigate", number: "2" },
  { id: 4, title: "Fourth Floor", subtitle: "Navigate", number: "4" },
]

export default function IndoorNavigationLanding() {
  const router = useRouter()

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
      },
    },
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  const handleFloorClick = (floorId: number) => {
    router.push(`/floor${floorId}`)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-sfpro px-4 py-12">
      <motion.div
        className="w-full max-w-6xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Building2 className="w-8 h-8 text-foreground" />
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              Indoor Navigation
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our building floors and find your way with precision
          </p>
        </motion.div>

        {/* Floor Cards Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {floors.map((floor) => (
            <motion.button
              key={floor.id}
              onClick={() => handleFloorClick(floor.id)}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-lg bg-card border border-border shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-300 group"
            >
              <div className="relative p-8 md:p-10 h-64 md:h-72 flex flex-col justify-between">
                
                {/* Top Section */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="inline-block px-3 py-1.5 rounded-md bg-muted text-muted-foreground text-xs font-semibold mb-4 uppercase tracking-wide">
                      Floor {floor.number}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                      {floor.title}
                    </h2>
                  </div>
                  <div className="text-6xl md:text-7xl font-light text-muted opacity-20 group-hover:opacity-30 transition-opacity">
                    {floor.number}
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="flex items-end justify-between">
                  <span className="text-muted-foreground font-medium text-sm">
                    {floor.subtitle}
                  </span>
                  <motion.div
                    className="w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center group-hover:bg-border group-hover:text-foreground transition-colors"
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-foreground to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
            </motion.button>
          ))}
        </motion.div>

        {/* Footer Info */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p className="text-sm text-muted-foreground">
            Select a floor to view the complete map and navigation details
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
