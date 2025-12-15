"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, MapPin } from "lucide-react"

type FloorPoint = {
  id: number
  x: number
  y: number
  fx: number
  fy: number
  tag: string
}

interface SearchableSelectProps {
  value: number
  onChange: (id: number) => void
  placeholder?: string
  points: FloorPoint[] // NEW: pass floor1Points or floor2Points
}

export default function SearchableSelect({
  value,
  onChange,
  placeholder = "Search locations...",
  points,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = points.filter(
    (p) => p.tag.toLowerCase().includes(search.toLowerCase()) || p.id.toString().includes(search),
  )

  const currentPoint = points.find((p) => p.id === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full font-sfpro">
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          setSearch("")
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0)
          }
        }}
        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-left flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <MapPin size={16} className="text-blue-500" />
          <span className="text-sm font-medium">
            {currentPoint ? currentPoint.tag : placeholder}
          </span>
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-sm"
          />
          <div className="max-h-64 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((point) => (
                <button
                  key={point.id}
                  onClick={() => {
                    onChange(point.id)
                    setIsOpen(false)
                    setSearch("")
                  }}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors ${
                    value === point.id
                      ? "bg-blue-100 dark:bg-slate-700 text-blue-900 dark:text-blue-200 font-medium"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                      {point.id}
                    </span>
                    {point.tag}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No locations found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}