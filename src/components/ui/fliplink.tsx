import React from "react";
import { motion } from "framer-motion";

const DURATION = 0.25;
const STAGGER = 0.025;

interface FlipLinkProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: string;
  className?: string;
  hovered?: boolean;
  blockMode?: boolean;
}

const FlipLink: React.FC<FlipLinkProps> = ({
  children,
  className = "",
  hovered = false,
  blockMode = false,
  ...rest
}) => {
  // When blockMode is true (for big headings), lineHeight and padding prevent clipping
  return (
    <span
      className={`relative overflow-hidden align-middle ${className}`}
      {...rest}
      style={{
        display: blockMode ? "flex" : "inline-block",
        lineHeight: blockMode ? 1.2 : undefined,                // add line height for headings
        verticalAlign: blockMode ? "baseline" : undefined,      // align to baseline, not middle
        paddingTop: blockMode ? "0.04em" : undefined,           // prevent top clipping
        paddingBottom: blockMode ? "0.15em" : undefined,        // prevent descender clipping
        ...rest.style
      }}
    >
      <span style={{ display: blockMode ? "flex" : "inline-block" }}>
        {children.split("").map((l, i) => (
          <motion.span
            animate={hovered ? "hovered" : "initial"}
            variants={{
              initial: { y: 0 },
              hovered: { y: "-100%" },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            style={{ display: "inline-block" }}
            key={i}
          >
            {l}
          </motion.span>
        ))}
      </span>
      <span
        className="absolute inset-0 pointer-events-none"
        style={{ display: blockMode ? "flex" : "inline-block" }}
      >
        {children.split("").map((l, i) => (
          <motion.span
            animate={hovered ? "hovered" : "initial"}
            variants={{
              initial: { y: "100%" },
              hovered: { y: 0 },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            style={{ display: "inline-block" }}
            key={i}
          >
            {l}
          </motion.span>
        ))}
      </span>
    </span>
  );
};

export default FlipLink;