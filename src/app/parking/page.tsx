"use client"

import { useState, useEffect, useMemo } from "react"
import { Car, RefreshCw, Clock, MapPin } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/card"
import { Badge } from "../components/badge"
import { Button } from "../components/button"
import { Progress } from "../components/progress"
import PageTitle from "../components/PageTitle"
import { io, Socket } from "socket.io-client"

// Choose one lot to be LIVE (driven by server via Socket.IO). Others remain simulated.
// Set this to "A" because your server emits A1, A2... slot IDs.
const LIVE_LOT_ID = "A"
const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4001"

// Mock data for parking lots (others keep simulating for visual richness)
const parkingData = [
  { id: "A", name: "Parking Lot A", capacity: 120, occupied: 102, status: "high", location: "North Campus" },
  { id: "B", name: "Parking Lot B", capacity: 80, occupied: 45, status: "medium", location: "South Campus" },
  { id: "C", name: "Faculty Parking", capacity: 40, occupied: 38, status: "high", location: "Main Building" },
  { id: "D", name: "Visitor Parking", capacity: 30, occupied: 12, status: "low", location: "Admin Block" },
  { id: "E", name: "Student Parking", capacity: 150, occupied: 125, status: "high", location: "Hostel Area" },
  { id: "F", name: "Event Parking", capacity: 60, occupied: 15, status: "low", location: "Sports Complex" },
] as const

type Lot = {
  id: string
  name: string
  capacity: number
  occupied: number
  status: "low" | "medium" | "high"
  location: string
}

type SnapshotPayload = {
  library: { occupied: number; totalSeats: number }
  parking: Array<{
    type: "parking_update"
    slotId: string
    distanceCm?: number
    occupied: boolean
    timestamp: string
  }>
}

type ParkingUpdate = {
  type: "parking_update"
  slotId: string
  distanceCm?: number
  occupied: boolean
  timestamp: string
}

function occupancyToStatus(ratio: number): Lot["status"] {
  if (ratio > 0.8) return "high"
  if (ratio > 0.5) return "medium"
  return "low"
}

export default function ParkingPage() {
  const [data, setData] = useState<Lot[]>(parkingData as unknown as Lot[])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedLot, setSelectedLot] = useState<string | null>(null)

  // Live lot state from server
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [liveSlots, setLiveSlots] = useState<Map<string, boolean>>(new Map())
  const [liveLotOccupied, setLiveLotOccupied] = useState<number | null>(null)
  const [lastLiveUpdate, setLastLiveUpdate] = useState<string | null>(null)

  // Connect to Socket.IO server to receive real updates for LIVE_LOT_ID
  useEffect(() => {
    let socket: Socket | null = null
    try {
      socket = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      })

      socket.on("connect", () => {
        setIsSocketConnected(true)
        socket?.emit("request_snapshot")
      })

      socket.on("disconnect", () => {
        setIsSocketConnected(false)
      })

      socket.on("snapshot", (snap: SnapshotPayload) => {
        // Aggregate all slots that belong to LIVE_LOT_ID
        const map = new Map<string, boolean>()
        for (const p of snap.parking) {
          if (belongsToLiveLot(p.slotId)) {
            map.set(p.slotId, p.occupied)
          }
        }
        setLiveSlots(map)
        const occupiedCount = Array.from(map.values()).filter(Boolean).length
        setLiveLotOccupied(occupiedCount)
        setLastLiveUpdate(new Date().toISOString())
      })

      socket.on("parking_update", (payload: ParkingUpdate) => {
        if (!belongsToLiveLot(payload.slotId)) return
        setLiveSlots((prev) => {
          const map = new Map(prev)
          map.set(payload.slotId, payload.occupied)
          const occupiedCount = Array.from(map.values()).filter(Boolean).length
          setLiveLotOccupied(occupiedCount)
          setLastLiveUpdate(payload.timestamp || new Date().toISOString())
          return map
        })
      })
    } catch {
      // ignore; UI will show disconnected state
    }
    return () => {
      if (socket) {
        socket.removeAllListeners()
        socket.disconnect()
      }
    }
  }, [])

  // Keep simulation running for ALL lots EXCEPT the live lot.
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) =>
        prev.map((lot) => {
          if (lot.id === LIVE_LOT_ID) {
            // Live lot: drive from socket server if we have data; otherwise keep existing until we do.
            const liveOcc = liveLotOccupied ?? lot.occupied
            const ratio = liveOcc / lot.capacity
            return { ...lot, occupied: liveOcc, status: occupancyToStatus(ratio) }
          }
          // Simulate for other lots
          const next = Math.max(0, Math.min(lot.capacity, lot.occupied + Math.floor(Math.random() * 5) - 2))
          const ratio = next / lot.capacity
          return { ...lot, occupied: next, status: occupancyToStatus(ratio) }
        }),
      )
    }, 10000)

    return () => clearInterval(interval)
  }, [liveLotOccupied])

  // Snap live lot immediately when liveLotOccupied changes (so UI updates without waiting for the next tick)
  useEffect(() => {
    if (liveLotOccupied == null) return
    setData((prev) =>
      prev.map((lot) => {
        if (lot.id !== LIVE_LOT_ID) return lot
        const clamped = Math.max(0, Math.min(lot.capacity, liveLotOccupied))
        const ratio = clamped / lot.capacity
        return { ...lot, occupied: clamped, status: occupancyToStatus(ratio) }
      }),
    )
  }, [liveLotOccupied])

  const refreshData = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1500)
  }

  const totalCapacity = useMemo(() => data.reduce((sum, lot) => sum + lot.capacity, 0), [data])
  const totalOccupied = useMemo(() => data.reduce((sum, lot) => sum + lot.occupied, 0), [data])
  const overallOccupancy = (totalOccupied / totalCapacity) * 100

  const selectedParkingLot = data.find((lot) => lot.id === selectedLot)

  return (
    <div className="container mx-auto px-4 py-8">
      <PageTitle title="Parking Information" description="Live updates on parking availability across campus" />

      <div className="mb-6 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          <span
            className={`inline-flex items-center gap-2 px-2 py-1 rounded ${
              isSocketConnected
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
            }`}
            title={lastLiveUpdate ? `Last live update: ${new Date(lastLiveUpdate).toLocaleString()}` : undefined}
          >
            <span className={`w-2 h-2 rounded-full ${isSocketConnected ? "bg-green-500" : "bg-red-500"}`} />
            {isSocketConnected ? "Live feed connected" : "Live feed disconnected"}
            <span className="hidden sm:inline">({displayLiveLotName(data, LIVE_LOT_ID)})</span>
          </span>
        </div>
        <Button variant="outline" className="flex items-center gap-2" onClick={refreshData} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Parking Availability</CardTitle>
                  <CardDescription>Real-time parking lot occupancy</CardDescription>
                </div>
                <Badge
                  variant={overallOccupancy > 80 ? "destructive" : overallOccupancy > 50 ? "default" : "secondary"}
                  className="text-sm"
                >
                  {Math.round(overallOccupancy)}% Full
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Occupancy</span>
                    <span className="font-medium">
                      {totalOccupied} / {totalCapacity} spaces
                    </span>
                  </div>
                  <Progress value={overallOccupancy} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Empty</span>
                    <span>Full</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.map((lot) => (
                    <Card
                      key={lot.id}
                      className={`overflow-hidden cursor-pointer transition-all ${
                        selectedLot === lot.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedLot(lot.id)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{lot.name}</CardTitle>
                            {lot.id === LIVE_LOT_ID && (
                              <Badge variant="outline" className="uppercase tracking-wide text-[10px]">
                                Live
                              </Badge>
                            )}
                          </div>
                          <Badge
                            variant={
                              lot.status === "high" ? "destructive" : lot.status === "medium" ? "default" : "secondary"
                            }
                          >
                            {lot.status === "high"
                              ? "Almost Full"
                              : lot.status === "medium"
                                ? "Filling Up"
                                : "Available"}
                          </Badge>
                        </div>
                        <CardDescription>{lot.location}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{Math.round((lot.occupied / lot.capacity) * 100)}% Full</span>
                            <span className="text-muted-foreground">
                              {lot.occupied} / {lot.capacity}
                            </span>
                          </div>
                          <Progress
                            value={(lot.occupied / lot.capacity) * 100}
                            className={`h-2 ${
                              lot.status === "high"
                                ? "bg-red-100 dark:bg-red-900/30"
                                : lot.status === "medium"
                                  ? "bg-yellow-100 dark:bg-yellow-900/30"
                                  : "bg-green-100 dark:bg-green-900/30"
                            }`}
                          />
                          {lot.id === LIVE_LOT_ID && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {isSocketConnected
                                ? `Live sensors: ${
                                    Array.from(liveSlots.values()).filter(Boolean).length
                                  } occupied / ${liveSlots.size || "—"} tracked`
                                : "Waiting for live data..."}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {selectedLot ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{selectedParkingLot?.name}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLot(null)}>
                    Close
                  </Button>
                </div>
                <CardDescription>{selectedParkingLot?.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-4">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeOpacity="0.1"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={
                          selectedParkingLot?.status === "high"
                            ? "#ef4444"
                            : selectedParkingLot?.status === "medium"
                              ? "#f59e0b"
                              : "#10b981"
                        }
                        strokeWidth="10"
                        strokeDasharray={`${(2 * Math.PI * 45 * (selectedParkingLot?.occupied || 0)) / (selectedParkingLot?.capacity || 1)} ${2 * Math.PI * 45 * (1 - (selectedParkingLot?.occupied || 0) / (selectedParkingLot?.capacity || 1))}`}
                        strokeDashoffset={2 * Math.PI * 45 * 0.25}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-bold">
                        {Math.round(((selectedParkingLot?.occupied || 0) / (selectedParkingLot?.capacity || 1)) * 100)}%
                      </span>
                      <span className="text-xs text-muted-foreground">Full</span>
                    </div>
                  </div>

                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Occupied Spaces</span>
                      </div>
                      <span className="font-medium">{selectedParkingLot?.occupied}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Total Capacity</span>
                      </div>
                      <span className="font-medium">{selectedParkingLot?.capacity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Available Spaces</span>
                      </div>
                      <span className="font-medium">
                        {(selectedParkingLot?.capacity || 0) - (selectedParkingLot?.occupied || 0)}
                      </span>
                    </div>
                  </div>

                  {selectedLot === LIVE_LOT_ID && (
                    <div className="mt-6 w-full">
                      <h4 className="text-sm font-medium mb-2">Live sensor slots</h4>
                      {liveSlots.size > 0 ? (
                        <div className="grid grid-cols-6 gap-2">
                          {Array.from(liveSlots.entries()).map(([slotId, occ]) => (
                            <div
                              key={slotId}
                              title={`${slotId} • ${occ ? "Occupied" : "Available"}`}
                              className={`text-center text-[10px] px-2 py-1 rounded ${
                                occ
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                  : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              }`}
                            >
                              {prettySlotLabel(slotId)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No live slots tracked yet.</p>
                      )}
                      {lastLiveUpdate && (
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          Last update: {new Date(lastLiveUpdate).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Get Directions</Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Parking Overview</CardTitle>
                <CardDescription>Select a parking lot for details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-4">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeOpacity="0.1"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={overallOccupancy > 80 ? "#ef4444" : overallOccupancy > 50 ? "#f59e0b" : "#10b981"}
                        strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 45 * (overallOccupancy / 100)} ${2 * Math.PI * 45 * (1 - overallOccupancy / 100)}`}
                        strokeDashoffset={2 * Math.PI * 45 * 0.25}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-bold">{Math.round(overallOccupancy)}%</span>
                      <span className="text-xs text-muted-foreground">Full</span>
                    </div>
                  </div>

                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Total Occupied</span>
                      </div>
                      <span className="font-medium">{totalOccupied}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Total Capacity</span>
                      </div>
                      <span className="font-medium">{totalCapacity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Available Spaces</span>
                      </div>
                      <span className="font-medium">{totalCapacity - totalOccupied}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Peak Hours</CardTitle>
              <CardDescription>When parking is busiest</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Current Status</h3>
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        overallOccupancy > 80 ? "bg-red-500" : overallOccupancy > 50 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                    ></div>
                    <span>
                      {overallOccupancy > 80
                        ? "Very busy - limited parking"
                        : overallOccupancy > 50
                          ? "Moderately busy"
                          : "Plenty of parking available"}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Today's Busy Times</h3>
                  <div className="grid grid-cols-4 gap-1">
                    {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((hour) => (
                      <div
                        key={hour}
                        className={`text-center py-1 text-xs rounded ${
                          (hour >= 8 && hour <= 10) || (hour >= 16 && hour <= 18)
                            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                            : hour >= 11 && hour <= 13
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                              : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        }`}
                      >
                        {hour > 12 ? `${hour - 12}PM` : `${hour}AM`}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Morning</span>
                    <span>Afternoon</span>
                    <span>Evening</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full text-sm text-muted-foreground">
                <p>Best times to find parking: 10:30 AM - 3:30 PM</p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )

  function belongsToLiveLot(slotId: string) {
    // Accept "A", "A1", "A-01", etc. when LIVE_LOT_ID === "A"
    return slotId === LIVE_LOT_ID || slotId.startsWith(`${LIVE_LOT_ID}`)
  }

  function prettySlotLabel(slotId: string) {
    // removes "A" or "A-" prefix from "A1" / "A-01"
    const re = new RegExp(`^${LIVE_LOT_ID}-?`)
    return slotId.replace(re, "")
  }

  function displayLiveLotName(lots: Lot[], id: string) {
    return lots.find((l) => l.id === id)?.name || `Lot ${id}`
  }
}