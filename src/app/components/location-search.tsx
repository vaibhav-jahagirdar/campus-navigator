"use client"

import { useState, useRef, useEffect } from "react"
import { floor2Points } from "../lib/floor2points"
import { Search, MapPin } from "lucide-react"

interface LocationSearchProps {
  onSelectStart: (id: number) => void
  onSelectEnd: (id: number) => void
}

export default function LocationSearch({ onSelectStart, onSelectEnd }: LocationSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [mode, setMode] = useState<"start" | "end" | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = floor2Points.filter(
    (p) => p.tag.toLowerCase().includes(search.toLowerCase()) || p.id.toString().includes(search),
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (id: number) => {
    if (mode === "start") {
      onSelectStart(id)
    } else if (mode === "end") {
      onSelectEnd(id)
    }
    setIsOpen(false)
    setSearch("")
    setMode(null)
  }

  return (
    <div ref={containerRef} className="relative w-full font-sfpro">
      <div className="flex gap-2">
        <button
          onClick={() => {
            setMode("start")
            setIsOpen(true)
            setTimeout(() => inputRef.current?.focus(), 0)
          }}
          className="flex-1 px-4 py-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-left flex items-center gap-2 hover:border-green-400 dark:hover:border-green-600 transition-all"
        >
          <MapPin size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
          <span className="text-xs font-medium text-green-700 dark:text-green-200">From...</span>
        </button>
        <button
          onClick={() => {
            setMode("end")
            setIsOpen(true)
            setTimeout(() => inputRef.current?.focus(), 0)
          }}
          className="flex-1 px-4 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-left flex items-center gap-2 hover:border-red-400 dark:hover:border-red-600 transition-all"
        >
          <MapPin size={14} className="text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-xs font-medium text-red-700 dark:text-red-200">To...</span>
        </button>
      </div>

      {isOpen && mode && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Search size={16} className="text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-sm"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((point) => (
                <button
                  key={point.id}
                  onClick={() => handleSelect(point.id)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {point.id}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{point.tag}</p>
                    </div>
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">No locations found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
