"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { BackgroundAnimation } from "../components/background-animation"
import { RegisterForm } from "../components/register-form"


export default function RegisterPage() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <BackgroundAnimation />

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="relative">
            {/* Neon glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Glassmorphism panel */}
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-8"
              >
                <h1 className="text-3xl font-bold text-white mb-2 text-center">Create Account</h1>
                <p className="text-center text-gray-400 text-sm">Join us and get started today</p>
              </motion.div>

              <RegisterForm />

              {/* Sign in link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="mt-6 text-center text-sm text-gray-400"
              >
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
                >
                  Sign in
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
