"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, easeOut } from "framer-motion"
import { X, Upload, AlertCircle, CheckCircle } from "lucide-react"

interface FormState {
  name: string
  description: string
  bannerImage: string
  venue: string
  location: string
  startDateTime: string
  endDateTime: string
  registrationRequired: boolean
  maxParticipants: number
  paymentRequired: boolean
  feeAmount: number
  categories: string[]
  tags: string[]
}

export default function AdminForm() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    bannerImage: "",
    venue: "",
    location: "",
    startDateTime: "",
    endDateTime: "",
    registrationRequired: true,
    maxParticipants: 0,
    paymentRequired: false,
    feeAmount: 0,
    categories: [],
    tags: [],
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categoryInput, setCategoryInput] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [success, setSuccess] = useState(false)

  // --- Handlers ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: Number(value) }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: checked }))
  }

  const addCategory = () => {
    if (categoryInput.trim() && !form.categories.includes(categoryInput.trim())) {
      setForm((prev) => ({
        ...prev,
        categories: [...prev.categories, categoryInput.trim()],
      }))
      setCategoryInput("")
    }
  }

  const removeCategory = (index: number) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }))
  }

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput("")
    }
  }

  const removeTag = (index: number) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (res.ok) {
        setForm((prev) => ({ ...prev, bannerImage: data.url }))
      } else {
        setError(data.error || "Failed to upload image")
      }
    } catch (err) {
      console.error(err)
      setError("Image upload failed")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.name || !form.description || !form.venue || !form.startDateTime || !form.endDateTime) {
      setError("Please fill all required fields")
      return
    }
    if (form.paymentRequired && form.feeAmount <= 0) {
      setError("Fee amount must be greater than 0 when payment is required")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials:"include",
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong")
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/events")
      }, 1500)
    } catch (err) {
      console.error(err)
      setError("Network error, please try again")
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: easeOut },
    },
  }

  const chipVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
    exit: { scale: 0, opacity: 0, transition: { duration: 0.2 } },
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <motion.form
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl shadow-2xl p-8 md:p-10 border border-zinc-800/50 backdrop-blur-sm"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Create Event
            </h2>
            <p className="text-zinc-400 text-sm">Fill in the details to create your next amazing event</p>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-green-300 text-sm">Event created successfully! Redirecting...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Event Name */}
          <motion.div variants={itemVariants} className="mb-6">
            <label className="block text-sm font-semibold text-zinc-100 mb-2">
              Event Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter event name"
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
              required
            />
          </motion.div>

          {/* Description */}
          <motion.div variants={itemVariants} className="mb-6">
            <label className="block text-sm font-semibold text-zinc-100 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter event description"
              rows={4}
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 resize-none"
              required
            />
          </motion.div>

          {/* Venue & Location */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-100 mb-2">
                Venue <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="venue"
                value={form.venue}
                onChange={handleChange}
                placeholder="Enter venue name"
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-100 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="City, State, or Address"
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
              />
            </div>
          </motion.div>

          {/* Date & Time */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-100 mb-2">
                Start Date & Time <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                name="startDateTime"
                value={form.startDateTime}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-100 mb-2">
                End Date & Time <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                name="endDateTime"
                value={form.endDateTime}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                required
              />
            </div>
          </motion.div>

          {/* Checkboxes */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 mb-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="registrationRequired"
                checked={form.registrationRequired}
                onChange={handleCheckboxChange}
                className="w-5 h-5 rounded bg-zinc-800 border border-zinc-700 text-blue-400 focus:ring-2 focus:ring-blue-400/20 cursor-pointer"
              />
              <span className="text-zinc-300 text-sm font-medium group-hover:text-zinc-100 transition-colors">
                Registration Required
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="paymentRequired"
                checked={form.paymentRequired}
                onChange={handleCheckboxChange}
                className="w-5 h-5 rounded bg-zinc-800 border border-zinc-700 text-blue-400 focus:ring-2 focus:ring-blue-400/20 cursor-pointer"
              />
              <span className="text-zinc-300 text-sm font-medium group-hover:text-zinc-100 transition-colors">
                Payment Required
              </span>
            </label>
          </motion.div>

          {/* Fee Amount */}
          <AnimatePresence>
            {form.paymentRequired && (
              <motion.div variants={itemVariants} initial="hidden" animate="visible" exit="hidden" className="mb-6">
                <label className="block text-sm font-semibold text-zinc-100 mb-2">
                  Fee Amount <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="feeAmount"
                  value={form.feeAmount}
                  onChange={handleNumberChange}
                  placeholder="Enter fee amount"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                  min={0}
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Max Participants */}
          <motion.div variants={itemVariants} className="mb-6">
            <label className="block text-sm font-semibold text-zinc-100 mb-2">Max Participants</label>
            <input
              type="number"
              name="maxParticipants"
              value={form.maxParticipants}
              onChange={handleNumberChange}
              placeholder="Leave 0 for unlimited"
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
              min={0}
            />
          </motion.div>

          {/* Categories */}
          <motion.div variants={itemVariants} className="mb-6">
            <label className="block text-sm font-semibold text-zinc-100 mb-2">Categories</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                placeholder="Add category and press Enter"
                className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={addCategory}
                className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Add
              </motion.button>
            </div>
            <motion.div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {form.categories.map((category, index) => (
                  <motion.div
                    key={category}
                    variants={chipVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-400/50 rounded-full"
                  >
                    <span className="text-sm text-blue-300">{category}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => removeCategory(index)}
                      className="text-blue-300 hover:text-blue-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Tags */}
          <motion.div variants={itemVariants} className="mb-6">
            <label className="block text-sm font-semibold text-zinc-100 mb-2">Tags</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add tag and press Enter"
                className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={addTag}
                className="px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Add
              </motion.button>
            </div>
            <motion.div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {form.tags.map((tag, index) => (
                  <motion.div
                    key={tag}
                    variants={chipVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 border border-cyan-400/50 rounded-full"
                  >
                    <span className="text-sm text-cyan-300">{tag}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => removeTag(index)}
                      className="text-cyan-300 hover:text-cyan-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Banner Image */}
          <motion.div variants={itemVariants} className="mb-8">
            <label className="block text-sm font-semibold text-zinc-100 mb-3">Banner Image</label>
            <motion.div
              whileHover={{ borderColor: "rgb(96, 165, 250)" }}
              className="relative border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 hover:bg-zinc-800/30"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-zinc-500" />
                <p className="text-zinc-300 text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-zinc-600 text-xs">PNG, JPG, GIF up to 10MB</p>
              </div>
            </motion.div>

            {/* Image Preview */}
            <AnimatePresence>
              {form.bannerImage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-4 relative rounded-lg overflow-hidden"
                >
                  <img
                    src={form.bannerImage || "/placeholder.svg"}
                    alt="Banner preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={itemVariants}>
            <motion.button
              type="submit"
              disabled={loading || success}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Creating Event...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Event Created!
                </>
              ) : (
                "Create Event"
              )}
            </motion.button>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  )
}
