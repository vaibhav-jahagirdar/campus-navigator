"use client"
import React, { useState } from "react"
import Link from "next/link"
import { Map, Compass, BookOpen, Calendar, CreditCard, Car, MapPin, Menu, X } from "lucide-react"
import { motion } from "framer-motion"
import FlipLink from '@/components/ui/fliplink'

interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: "/outdoorMap", label: "MAP", Icon: Map },
  { href: "/indoormaps", label: "INDOOR NAVIGATION", Icon: Compass },
  { href: "/library", label: "LIBRARY", Icon: BookOpen },
  { href: "/eventspage", label: "EVENTS", Icon: Calendar },
  { href: "/parking", label: "PARKING", Icon: Car }
]


export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const toggleMenu = () => setIsOpen((prev) => !prev)

  return (
    <motion.nav
      role="navigation"
      aria-label="Main Navigation"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-gray-950  text-gray-400 font-sfpro w-full h-[9vh] flex justify-between items-center px-4 md:px-6 lg:px-4 z-50 absolute"
    >
      {/* Brand */}
      <div className="flex items-center space-x-2 ml-2 md:ml-6 lg:ml-1 font-poppins text-white tracking-[-0.06em]">
        <MapPin className="w-5 h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-gray-50" />
        <Link
          href="/"
          className="text-xl md:text-[15px] lg:text-2xl font-semibold whitespace-nowrap"
        >
          CAMPUS NAVIGATOR
        </Link>
      </div>

      {/* Hamburger (mobile only) */}
      <div className="md:hidden">
        {isOpen ? (
          <X className="w-6 h-6 text-white cursor-pointer" onClick={toggleMenu} />
        ) : (
          <Menu className="w-6 h-6 text-white cursor-pointer" onClick={toggleMenu} />
        )}
      </div>

      {/* Desktop / Medium and Large Screens Menu */}
      <div className="hidden md:flex font-poppins text-gray-300 font-semibold mr-5 md:space-x-9 lg:space-x-12">
        {navItems.map(({ href, label, Icon }, idx) => (
          <Link
            key={label}
            href={href}
            className="flex items-center space-x-1 md:space-x-1 lg:space-x-2 text-gray-300 opacity-70 hover:opacity-100 hover:text-gray-100 duration-300 ease-in-out transition-all whitespace-nowrap"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <Icon className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
            <FlipLink hovered={hoveredIdx === idx} className="text-[13px] md:text-[13px] lg:text-base">
              {label}
            </FlipLink>
          </Link>
        ))}
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden absolute top-[12vh] left-0 w-full bg-black border-t border-gray-800 shadow-md py-4 z-40">
          <div className="grid grid-cols-1 gap-4 px-4">
            {navItems.map(({ href, label, Icon }, idx) => (
              <Link
                key={label}
                href={href}
                onClick={toggleMenu}
                className="flex items-center space-x-3 text-gray-300 hover:text-white hover:bg-gray-950 p-3 rounded-lg transition-all duration-200"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <FlipLink className="font-medium text-base" hovered={hoveredIdx === idx}>
                  {label}
                </FlipLink>
              </Link>
            ))}
          </div>
        </div>
      )}
    </motion.nav>
  )
}