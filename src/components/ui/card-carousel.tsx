// src/components/ui/card-carousel.js (or .tsx)

"use client"

import React from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import "swiper/css/effect-coverflow"
import "swiper/css/pagination"
import "swiper/css/navigation"
import { Autoplay, EffectCoverflow, Navigation, Pagination } from "swiper/modules"

interface CardCarouselProps {
  children: React.ReactNode[];
  autoplayDelay?: number;
  showPagination?: boolean;
  showNavigation?: boolean;
}

export const CardCarousel: React.FC<CardCarouselProps> = ({
  children,
  autoplayDelay = 1500,
  showPagination = true,
  showNavigation = true,
}) => {
  const css = `
    .swiper { width: 100%; padding-bottom: 50px; }
    .swiper-slide { background-position: center; background-size: cover; width: 320px; }
    .swiper-3d .swiper-slide-shadow-left,
    .swiper-3d .swiper-slide-shadow-right { background: none; }
  `
  return (
    <section>
      <style>{css}</style>
      <div className="mx-auto w-full max-w-full">
        <Swiper
          spaceBetween={60}
          autoplay={{
            delay: autoplayDelay,
            disableOnInteraction: false,
          }}
          effect={"coverflow"}
          grabCursor={true}
          centeredSlides={true}
          loop={true}
          slidesPerView={"auto"}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 100,
            modifier: 2.5,
          }}
          pagination={showPagination}
          navigation={
            showNavigation
              ? {
                  nextEl: ".swiper-button-next",
                  prevEl: ".swiper-button-prev",
                }
              : undefined
          }
          modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
        >
          {React.Children.map(children, (child, idx) => (
            <SwiperSlide key={idx}>
              {child}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}