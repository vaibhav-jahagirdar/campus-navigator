"use client";
import { motion } from "framer-motion";
import {
  MapPin, Building2, BookOpen, Car, Trash2, DoorOpen, CreditCard, Calendar
} from "lucide-react";
import FeatureCard from "./Featurecard";
import { CardCarousel } from "@/components/ui/card-carousel";
// Import the TextScroll componenteeEE
import { TextScroll } from "@/components/ui/text-scroll"; // Adjust path if needed

const features = [
  {
    icon: <MapPin className="h-9 w-9 text-blue-600" />,
    title: "Outdoor Navigation",
    description: "Find the fastest route across campus with an easy-to-use interactive map."
  },
  {
    icon: <Building2 className="h-9 w-9 text-green-500" />,
    title: "Indoor Navigation",
    description: "Locate classrooms, labs, and staff rooms instantly with clear indoor guidance."
  },
  {
    icon: <BookOpen className="h-9 w-9 text-yellow-500" />,
    title: "Library Availability",
    description: "Check live seating availability before visiting the library."
  },
  {
    icon: <Car className="h-9 w-9 text-violet-500" />,
    title: "Parking Status",
    description: "See which parking spots are open in real time."
  },
  {
    icon: <Calendar className="h-9 w-9 text-lime-600" />,
    title: "Campus Events",
    description: "Stay updated on ongoing and upcoming events across the campus."
  }
];


const Features = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.1 }}
      className="features-section mt-5 bg-gray-200 py-12 px-4 sm:px-8 md:px-12 lg:px-16"
    >
      {/* Animated Text Scroll Effect for Main Tagline */}
      <div className="mb-4">
        <TextScroll
          text="EXPLORE OUR FEATURES."
          className="text-black bg-gray-200 shadow-lg text-center font-poppins text-3xl sm:text-4xl md:text-5xl mb-4 font-semibold lg:tracking-[-0.07em] lg:text-9xl"
          default_velocity={2} // You can tweak the speed as you like
        />
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        viewport={{ once: true }}
        className="text-gray-700 text-center text-base sm:text-lg md:text-xl lg:text-4xl font-medium tracking-[-0.03em] opacity-60 mb-2"
      >
        Discover the innovative tools and services that make our Smart
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="text-gray-700 text-center  sm:text-lg md:text-xl lg:text-4xl font-medium  opacity-60 mb-12"
      >
        Campus Navigator a cutting-edge solution.
      </motion.p>

      {/* Card Carousel Section with Framer Motion Animations on Card Loading */}
      <div className="min-w-full gap-x-8 ">
        <CardCarousel autoplayDelay={3000} showPagination showNavigation>
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
              viewport={{ once: true }}
              className="flex justify-center py-8 min-w-fu"
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </CardCarousel>
      </div>
    </motion.section>
  );
};

export default Features;