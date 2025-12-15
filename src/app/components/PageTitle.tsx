"use client"

import { motion } from "framer-motion"

interface PageTitleProps {
  title: string
  description?: string
}

export default function PageTitle({ title, description }: PageTitleProps) {
  return (
    <div className="mb-8 font-sfpro">
      <motion.h1
        className="text-4xl font-bold font-poppin tracking-[-0.03em] mb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {title}
      </motion.h1>
      {description && (
        <motion.p
          className="text-xl text-muted-foreground"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {description}
        </motion.p>
      )}
    </div>
  )
}

