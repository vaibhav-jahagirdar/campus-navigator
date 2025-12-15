"use client"

import Link from "next/link"
import type React from "react"
import { motion, easeOut } from "framer-motion"
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

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
}

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError("All fields are required")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Login failed")
      } else {
        router.push("/adminform")
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
          <div className="relative bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
            {error}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
        <motion.input
          whileFocus={{ scale: 1.02 }}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all duration-200"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
        <motion.input
          whileFocus={{ scale: 1.02 }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all duration-200"
        />
      </motion.div>

      <motion.div variants={itemVariants} className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors duration-200"
        >
          Forgot password?
        </Link>
      </motion.div>

      <motion.button
        variants={itemVariants}
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full mt-6 group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg blur opacity-40 group-hover:opacity-60 transition-opacity duration-200" />

        <div className="relative bg-gradient-to-r from-gray-300 to-gray-500 hover:from-gray-200 hover:to-gray-400 text-black font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
              />
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </div>
      </motion.button>
    </motion.form>
  )
}
