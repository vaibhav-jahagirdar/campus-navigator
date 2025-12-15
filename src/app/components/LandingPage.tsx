"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import FlipLink from "@/components/ui/fliplink";

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: (i: number = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.40 + 0.10 * i,
      duration: 1.5,
      type: "spring" as const,
      stiffness: 50,
    },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number = 1) => ({
    opacity: 1,
    transition: {
      delay: 0.40 + 0.10 * i,
      duration: 1.5,
      type: "tween" as const,
    },
  }),
};

const listStagger = {
  visible: {
    transition: {
      staggerChildren: 0.25,
      delayChildren: 1.2,
    },
  },
};

const listItem = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 60,
      duration: 1.1,
    },
  },
};

export default function LandingPage() {
  const [h1Hovered, setH1Hovered] = useState(false);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-900 flex px-0 sm:px-1 items-center justify-center">
        {/* Container with relative for absolute video positioning */}
        <div className="rounded-none sm:rounded-3xl overflow-hidden w-full h-[91vh] sm:w-screen sm:h-screen shadow-none sm:shadow-lg mt-0 sm:mt-[9vh] relative bg-white">
          <motion.video
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.2, ease: "easeOut" }}
          >
            <source src="/abc.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </motion.video>

          {/* Main content overlay */}
          <motion.div
            className="absolute inset-0 flex flex-col lg:flex-row text-black z-10 p-3 sm:p-6 lg:p-12"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            {/* Left section - Main heading and subheading */}
            <div className="flex-1 flex flex-col justify-center sm:justify-start lg:justify-center">
              <motion.h1
                className="text-black text-2xl sm:text-6xl md:text-8xl lg:text-[12rem]  mb-6 sm:mb-10 xl:text-[16.8rem] font-semibold font-sfpro tracking-[-0.07em] leading-none xl:pr-[-0.5em]"
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                custom={1}
                transition={{ type: "spring", stiffness: 120 }}
              >
                {/* --- FIX: Add flex and whitespace-nowrap to span, and whitespace-nowrap to both FlipLinks --- */}
                <span
                  className="flex items-center whitespace-nowrap"
                  onMouseEnter={() => setH1Hovered(true)}
                  onMouseLeave={() => setH1Hovered(false)}
                >
                  <FlipLink
                    hovered={h1Hovered}
                    className="whitespace-nowrap"
                  >
                    Navigato
                  </FlipLink>
                  <FlipLink
                    hovered={h1Hovered}
                    className="text-lg sm:text-5xl md:text-7xl lg:text-[11rem] xl:text-[15rem] relative ml-1 sm:ml-2 lg:ml-5 text-black font-extrabold whitespace-nowrap"
                  >
                    ®
                  </FlipLink>
                </span>
              </motion.h1>

              <motion.h2
                className="text-gray-600 text-xs sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl tracking-[-0.05em] mt-2 lg:mt-[-1.0em] font-semibold text-center sm:text-right lg:flex lg:justify-end"
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                custom={2}
              >
                Navigation, Redefined.
              </motion.h2>

              {/* Subtagline section */}
              <motion.div
                className="mt-4 sm:mt-12 lg:mt-32 max-w-full lg:max-w-4xl pl-0 sm:pl-10 md:ml-[-6.5rem]"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                custom={3}
              >
                <motion.p
                  className="text-black text-xs sm:text-base lg:text-xl font-sfpro font-medium tracking-[-0.02em]"
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  custom={3}
                >
                  <span className="font-medium block sm:inline lg:pl-28">
                    No confusing maps. No outdated directions.
                  </span>
                </motion.p>
                <motion.p
                  className="text-gray-500 text-xs sm:text-base lg:text-xl lg:pl-6 mt-1 sm:mt-0"
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  custom={4}
                >
                  Just seamless navigation and real-time tools to enhance your campus experience.
                </motion.p>
              </motion.div>
            </div>

            {/* Right section - Feature list */}
            <motion.div
              className="flex-shrink-0 mt-4 sm:mt-8 lg:ml-[-8.5rem] flex flex-col justify-center lg:justify-end lg:mb-10"
              initial="hidden"
              animate="visible"
              variants={listStagger}
            >
              <motion.ul
                className="text-xs sm:text-base lg:text-xl font-semibold font-sfpro tracking-[-0.02em] space-y-1 sm:space-y-2 lg:space-y-3 lg:pl-5"
                initial="hidden"
                animate="visible"
                variants={listStagger}
              >
                {[
  "Outdoor Map and Smart Routing",
  "Indoor Navigation for Campus Blocks",
  "Live Library and Parking Updates",
  "Real Time Campus Events",
]
.map((feature, idx) => (
                  <motion.li
                    className="flex items-center"
                    key={feature}
                    variants={listItem}
                    whileHover={{ scale: 1.07, color: "#000" }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <motion.span
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black rounded-full mr-2 sm:mr-3 lg:hidden"
                      initial={{ scale: 0.7, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 1.5 + idx * 0.2 }}
                    />
                    {feature}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </motion.div>

          {/* Copyright at the bottom */}
          <motion.div
            className="absolute bottom-3 sm:bottom-8 lg:bottom-15 left-1/2 transform -translate-x-1/2 lg:left-16 lg:transform-none w-full flex justify-center lg:justify-start z-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2, duration: 1.1, type: "tween" as const }}
          >
            <motion.p
              className="text-black text-xs sm:text-base lg:text-lg font-sfpro font-medium opacity-90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 1.1 }}
            >
              © 2025 campusnavigator
              <motion.span
                className="align-super text-[10px] sm:text-sm lg:text-base ml-1"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 2.8, duration: 0.7, type: "spring" }}
              >
                ®
              </motion.span>
            </motion.p>
          </motion.div>
        </div>
      </main>
    </>
  );
}