import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/pagination';
import SectionHeading from './SectionHeading';
import Reveal from './Reveal';
import { TESTIMONIALS } from '../utils/constants';

export default function Testimonials() {
  const swiperRef = useRef(null);

  return (
    <section id="testimonials" className="relative scroll-mt-24 overflow-hidden py-24 lg:py-32">
      <div className="grid-lines absolute inset-0 opacity-[0.3]" aria-hidden="true" />
      <div className="absolute left-[-8%] top-1/4 h-80 w-80 rounded-full bg-primary/5 blur-[110px]" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading
            align="left"
            eyebrow="Testimonials"
            title="What Our Customers Say"
            text="Real stories from homeowners and businesses who trusted Ledge Roofing with their most important investment."
            className="max-w-2xl"
          />
          <Reveal direction="up" delay={0.2} className="flex items-center gap-3">
            <button
              onClick={() => swiperRef.current?.slidePrev()}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white text-ink shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => swiperRef.current?.slideNext()}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white text-ink shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </Reveal>
        </div>

        <Reveal direction="up" delay={0.15} className="mt-14">
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            modules={[Autoplay, Pagination]}
            spaceBetween={28}
            slidesPerView={1}
            loop
            speed={800}
            autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            pagination={{ clickable: true, el: '.swiper-custom-pagination' }}
            breakpoints={{
              640: { slidesPerView: 1.2 },
              900: { slidesPerView: 2 },
              1280: { slidesPerView: 3 },
            }}
            className="!pb-16 [&_.swiper-pagination-bullet]:!h-2.5 [&_.swiper-pagination-bullet]:!w-2.5 [&_.swiper-pagination-bullet]:!bg-muted/40 [&_.swiper-pagination-bullet-active]:!bg-primary"
          >
            {TESTIMONIALS.map((t) => (
              <SwiperSlide key={t.id} className="!h-auto">
                <div className="glass flex h-full flex-col rounded-[1.75rem] p-8 shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-float">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-primary">
                      <Quote className="h-5 w-5 fill-current" />
                    </span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="mt-6 flex-1 text-[0.95rem] leading-relaxed text-charcoal">
                    “{t.review}”
                  </p>

                  <div className="mt-8 flex items-center gap-4 border-t border-line/70 pt-6">
                    <div className="relative">
                      <img
                        src={t.image}
                        alt={`${t.name}, ${t.location} — Ledge Roofing customer`}
                        className="h-14 w-14 rounded-full border-2 border-primary object-cover"
                        loading="lazy"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                        <Star className="h-2.5 w-2.5 fill-current" />
                      </span>
                    </div>
                    <div>
                      <div className="font-display text-base font-bold text-ink">{t.name}</div>
                      <div className="text-xs font-medium text-muted">
                        {t.role} • {t.location}
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="swiper-custom-pagination mt-2 flex justify-center" />
        </Reveal>
      </div>
    </section>
  );
}
