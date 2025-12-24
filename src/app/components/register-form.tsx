"use client"
import type React from "react"
import { motion, type Variants } from "framer-motion"
import { useRouter } from "next/navigation"
import { useState } from "react"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.58, 1] as [number, number, number, number] },
  },
}

export function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name || !email || !password) {
      setError("All fields are required")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed")
      } else {
        router.push("/teams")
      }
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 font-sfpro"
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-red-500/20 rounded-lg blur opacity-75" />
          <div className="relative bg-red-50 border border-red-300 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        </motion.div>
      )}

      {/* Name field */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
        <motion.input
          whileFocus={{ scale: 1.02 }}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Your Name"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200"
        />
      </motion.div>

      {/* Email field */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        <motion.input
          whileFocus={{ scale: 1.02 }}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200"
        />
      </motion.div>

      {/* Password field */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
        <motion.input
          whileFocus={{ scale: 1.02 }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200"
        />
      </motion.div>

      <motion.button
        variants={itemVariants}
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full mt-6 group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-400 rounded-lg blur opacity-40 group-hover:opacity-60 transition-opacity duration-200" />

        {/* Button content */}
        <div className="relative bg-gradient-to-r from-gray-700 to-gray-500 hover:from-gray-800 hover:to-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: [0, 0, 1, 1] }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </div>
      </motion.button>
    </motion.form>
  )
}