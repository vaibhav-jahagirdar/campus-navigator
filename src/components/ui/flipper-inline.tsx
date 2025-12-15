"use client";
import React from "react";
import { motion } from "framer-motion";

const DURATION = 0.25;
const STAGGER = 0.025;

interface FlipperInlineProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: string;
}

const FlipperInline: React.FC<FlipperInlineProps> = ({ children, className = "", ...rest }) => (
  <span className={`relative inline-block overflow-hidden align-middle ${className}`} {...rest}>
    {/* Normal label */}
    <motion.span
      initial="initial"
      whileHover="hovered"
      className="block"
      style={{ pointerEvents: 'none' }}
    >
      <span>
        {children.split("").map((l, i) => (
          <motion.span
            key={i}
            variants={{
              initial: { y: 0 },
              hovered: { y: "-100%" },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            className="inline-block"
          >
            {l}
          </motion.span>
        ))}
      </span>
      <span className="absolute inset-0 left-0 top-0 pointer-events-none">
        {children.split("").map((l, i) => (
          <motion.span
            key={i}
            variants={{
              initial: { y: "100%" },
              hovered: { y: 0 },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            className="inline-block"
          >
            {l}
          </motion.span>
        ))}
      </span>
    </motion.span>
  </span>
);

export default FlipperInline;