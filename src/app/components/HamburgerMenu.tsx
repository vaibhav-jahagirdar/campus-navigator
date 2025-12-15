"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Map, Compass, BookOpen, Calendar, Car } from "lucide-react";

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/outdoorMap", label: "Map", Icon: Map },
    { href: "/indoormaps", label: "Indoor navigation", Icon: Compass },
    { href: "/library", label: "Library", Icon: BookOpen },
    { href: "/eventspage", label: "Events", Icon: Calendar },
    { href: "/parking", label: "Parking", Icon: Car },
  ];

  const handleNavClick = (href: string) => {
    if (typeof window !== "undefined") {
      window.location.href = href;
    }
    setIsOpen(false);
  };

  // ✅ Typed variants
  const menuVariants: Variants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
        staggerChildren: 0.07,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    closed: { opacity: 0, x: 20 },
    open: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const overlayVariants: Variants = {
    closed: { opacity: 0, transition: { duration: 0.3 } },
    open: { opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <>
      {/* Hamburger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-16 right-6 z-50 w-12 h-12 bg-neutral-900 rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-lg hover:bg-neutral-800 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className="w-5 h-0.5 bg-white rounded-full"
          animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.3 }}
        />
        <motion.span
          className="w-5 h-0.5 bg-white rounded-full"
          animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
        <motion.span
          className="w-5 h-0.5 bg-white rounded-full"
          animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Slide-in Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-40 flex flex-col"
          >
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-xl font-bold text-neutral-900">Navigation</h2>
            </div>

            <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
              {navItems.map((item) => (
                <motion.button
                  key={item.href}
                  variants={itemVariants}
                  onClick={() => handleNavClick(item.href)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-100 transition-colors group text-left"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center group-hover:bg-neutral-800 transition-colors">
                    <item.Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-base font-medium text-neutral-900">
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </nav>

            <motion.div variants={itemVariants} className="p-6 border-t border-neutral-200">
              <p className="text-sm text-neutral-500 text-center">
                Campus navigation system
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
