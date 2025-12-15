
"use client"

import { useState, useEffect } from "react"
import io from "socket.io-client"
import { Users, Clock, RefreshCw, ArrowUpDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/card"
import { Badge } from "../components/badge"
import { Button } from "../components/button"
import { Progress } from "../components/progress"
import PageTitle from "../components/PageTitle"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4001"

const SENSOR_TO_FLOOR_ID: Record<string, number> = {
  rfid_1: 1,
  rfid_2: 2,
  rfid_3: 3,
}

const FIXED_FLOOR2_OCCUPIED = 15

const initialData = {
  capacity: 350,
  current: FIXED_FLOOR2_OCCUPIED,
  floors: [
    { id: 1, name: "Ground Floor", capacity: 120, occupied: 0 },
    { id: 2, name: "First Floor", capacity: 150, occupied: 0 },
    { id: 3, name: "Second Floor", capacity: 80, occupied: FIXED_FLOOR2_OCCUPIED },
  ],
  peakHours: [
    { hour: 9, occupancy: 40 },
    { hour: 10, occupancy: 55 },
    { hour: 11, occupancy: 70 },
    { hour: 12, occupancy: 85 },
    { hour: 13, occupancy: 90 },
    { hour: 14, occupancy: 80 },
    { hour: 15, occupancy: 75 },
    { hour: 16, occupancy: 65 },
    { hour: 17, occupancy: 50 },
    { hour: 18, occupancy: 35 },
    { hour: 19, occupancy: 25 },
    { hour: 20, occupancy: 15 },
  ],
}

export default function LibraryPage() {
  const [data, setData] = useState(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sortBy, setSortBy] = useState<"name" | "occupancy">("occupancy")
  const [activeFloor, setActiveFloor] = useState<number>(initialData.floors[0].id)

  useEffect(() => {
    // Ensure we only run on the client
    if (typeof window === "undefined") return

    const socket = io(SOCKET_URL, { transports: ["websocket"] })

    const onConnect = () => {
      socket.emit("request_snapshot")
    }

    const onSnapshot = () => {
      setData(prev => {
        const updatedFloors = prev.floors.map(f =>
          f.id === 3 ? { ...f, occupied: FIXED_FLOOR2_OCCUPIED } : f
        )
        const newTotal = updatedFloors.reduce((sum, f) => sum + f.occupied, 0)
        return { ...prev, floors: updatedFloors, current: newTotal }
      })
    }

    const onLibraryUpdate = (update: any) => {
      const sensor: string | undefined = update?.sensor
      const status: "entry" | "exit" | undefined = update?.status
      const floorId: number | undefined = sensor ? SENSOR_TO_FLOOR_ID[sensor] : undefined

      if (!floorId || floorId === 3) {
        return
      }

      setData(prev => {
        const updatedFloors = prev.floors.map(f => {
          if (f.id !== floorId) {
            if (f.id === 3 && f.occupied !== FIXED_FLOOR2_OCCUPIED) {
              return { ...f, occupied: FIXED_FLOOR2_OCCUPIED }
            }
            return f
          }

          let next = f.occupied
          if (status === "entry") next = Math.min(f.capacity, f.occupied + 1)
          if (status === "exit") next = Math.max(0, f.occupied - 1)
          return { ...f, occupied: next }
        })

        const newTotal = updatedFloors.reduce((sum, f) => sum + f.occupied, 0)
        return { ...prev, floors: updatedFloors, current: newTotal }
      })
    }

    socket.on("connect", onConnect)
    socket.on("snapshot", onSnapshot)
    socket.on("library_update", onLibraryUpdate)

    return () => {
      socket.off("connect", onConnect)
      socket.off("snapshot", onSnapshot)
      socket.off("library_update", onLibraryUpdate)
      socket.disconnect()
    }
  }, [])

  const refreshData = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const sortedFloors = [...data.floors].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name)
    return b.occupied / b.capacity - a.occupied / a.capacity
  })

  const currentFloor = data.floors.find(f => f.id === activeFloor) || data.floors[0]

  return (
    <div className="container mx-auto px-4 py-8 font-sfpro">
      <PageTitle title="Library Occupancy" description="Real-time data on library seating and availability" />

      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setSortBy(sortBy === "name" ? "occupancy" : "name")}
          >
            <ArrowUpDown className="h-4 w-4" />
            Sort by {sortBy === "name" ? "Occupancy" : "Name"}
          </Button>
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
                  <CardTitle>Library Overview</CardTitle>
                  <CardDescription>Current occupancy across all floors</CardDescription>
                </div>
                <Badge
                  variant={
                    data.current / data.capacity > 0.8
                      ? "destructive"
                      : data.current / data.capacity > 0.5
                      ? "default"
                      : "secondary"
                  }
                  className="text-sm"
                >
                  {Math.round((data.current / data.capacity) * 100)}% Occupied
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Occupancy</span>
                    <span className="font-medium">
                      {data.current} / {data.capacity} seats
                    </span>
                  </div>
                  <Progress value={(data.current / data.capacity) * 100} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Empty</span>
                    <span>Full</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sortedFloors.map((floor) => (
                    <Card
                      key={floor.id}
                      className={`overflow-hidden cursor-pointer transition-all ${
                        activeFloor === floor.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setActiveFloor(floor.id)}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">{floor.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{Math.round((floor.occupied / floor.capacity) * 100)}% Full</span>
                            <span className="text-muted-foreground">
                              {floor.occupied} / {floor.capacity}
                            </span>
                          </div>
                          <Progress
                            value={(floor.occupied / floor.capacity) * 100}
                            className={`h-2 ${
                              floor.occupied / floor.capacity > 0.8
                                ? "bg-red-100 dark:bg-red-900/30"
                                : floor.occupied / floor.capacity > 0.5
                                ? "bg-yellow-100 dark:bg-yellow-900/30"
                                : "bg-green-100 dark:bg-green-900/30"
                            }`}
                          />
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
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
              <CardDescription>Library occupancy overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" strokeOpacity="0.1" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={
                        data.current / data.capacity > 0.8
                          ? "#ef4444"
                          : data.current / data.capacity > 0.5
                          ? "#f59e0b"
                          : "#10b981"
                      }
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 45 * (data.current / data.capacity)} ${2 * Math.PI * 45 * (1 - data.current / data.capacity)}`}
                      strokeDashoffset={2 * Math.PI * 45 * 0.25}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-bold">{Math.round((data.current / data.capacity) * 100)}%</span>
                    <span className="text-xs text-muted-foreground">Occupied</span>
                  </div>
                </div>

                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Current Visitors</span>
                    </div>
                    <span className="font-medium">{data.current}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm">Total Capacity</span>
                    </div>
                    <span className="font-medium">{data.capacity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Available Seats</span>
                    </div>
                    <span className="font-medium">{data.capacity - data.current}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Peak Hours</CardTitle>
              <CardDescription>When the library is busiest</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-1 h-32 items-end">
                  {data.peakHours.map((hour) => (
                    <div key={hour.hour} className="relative h-full flex flex-col justify-end">
                      <div
                        className={`w-full rounded-t ${
                          hour.occupancy > 80
                            ? "bg-red-500"
                            : hour.occupancy > 50
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ height: `${hour.occupancy}%` }}
                      />
                      <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs">
                        {hour.hour > 12 ? `${hour.hour - 12}p` : `${hour.hour}a`}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-6 flex justify-between text-xs text-muted-foreground">
                  <span>Morning</span>
                  <span>Afternoon</span>
                  <span>Evening</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full text-sm text-muted-foreground">
                <p>Best times to visit: Before 10 AM or after 6 PM</p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
