"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { AlertCircle, Calendar, MapPin, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

interface Event {
  _id: string;
  name: string;
  description: string;
  bannerImage: string;
  venue: string;
  startDateTime: string;
  endDateTime: string;
  categories: string[];
  tags: string[];
  isVideo?: boolean;
}

interface PaginatedResponse {
  page: number;
  limit: number;
  totalPages: number;
  totalEvents: number;
  events: Event[];
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = 6;
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.98]);

  const fetchEvents = async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events?page=${pageNumber}&limit=${limit}`);
      const data: PaginatedResponse = await res.json();

      if (!res.ok) setError("Failed to fetch events");
      else {
        setEvents(data.events);
        setPage(data.page);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error(err);
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(page);
  }, [page]);

  const hardcodedEvent: Event = {
    _id: "static1",
    name: "Auto Turbulence",
    description:
      "A high-energy auto show at Acharya Habba featuring car drifts, stunts, and motorcycle performances by professional teams — an adrenaline-packed motorsport spectacle in Bangalore.",
    bannerImage: "/habba.mp4",
    venue: "Basketball Ground",
    startDateTime: new Date("2026-02-15T17:00:00").toISOString(),
    endDateTime: new Date("2026-02-15T19:00:00").toISOString(),
    categories: ["Auto Show", "Stunts", "Motorsport"],
    tags: ["AutoTurbulence", "AcharyaHabba", "DriftShow", "BikeStunts"],
    isVideo: true,
  };

  const allEvents = [hardcodedEvent, ...events];

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden"
    >
      {/* Header */}
      <motion.div
        style={{ opacity, scale }}
        className="relative z-10 pt-10 pb-12 px-4 md:px-8 lg:px-12 flex justify-between items-start"
      >
        <div className="max-w-7xl mx-auto flex-1">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-7xl font-bold text-slate-900 dark:text-white mb-4 leading-tight"
          >
            Upcoming Events
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl"
          >
            Experience unforgettable moments at our curated selection of premium events
          </motion.p>
        </div>

        {/* Admin Login Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/login")}
          className="fixed top-6 right-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2 rounded-lg shadow-md flex items-center gap-2 transition-all duration-300"
        >
          <LogIn className="w-4 h-4" />
          Admin Login
        </motion.button>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-20 mx-4 md:mx-8 lg:mx-12 mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 backdrop-blur-sm"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative z-10 px-4 md:px-8 lg:px-12 pb-20"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {allEvents.map((event, index) => (
              <EventCard key={event._id} event={event} index={index} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function EventCard({ event, index }: { event: Event; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };
  const handleMouseLeave = () => {
    if (videoRef.current) videoRef.current.pause();
  };

  const startDate = new Date(event.startDateTime);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: false, margin: "-100px" }}
      className="group h-full font-sfpro"
    >
      <motion.div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative h-full rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-500 shadow-sm hover:shadow-md"
      >
        <div className="relative h-72 md:h-80 overflow-hidden">
          {event.isVideo ? (
            <video
              ref={videoRef}
              src={event.bannerImage}
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <motion.img
              src={event.bannerImage}
              alt={event.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          )}
        </div>

        <div className="p-4 flex flex-col h-[calc(100%-18rem)] md:h-[calc(100%-20rem)]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{event.name}</h3>
          <p className="text-slate-600 dark:text-slate-400 text-xs mb-3 line-clamp-2 flex-grow">
            {event.description}
          </p>
          <div className="space-y-2 mb-3 border-t border-slate-200 dark:border-slate-700 pt-3">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-slate-900 dark:text-slate-200 font-semibold">
                {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} • 5 PM
              </p>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1">{event.venue}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="w-full mt-auto py-2 bg-blue-600 dark:bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300"
          >
            Explore Event →
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}