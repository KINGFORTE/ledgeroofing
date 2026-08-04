import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Ruler, Target, Lightbulb, TrendingUp, X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard } from 'swiper/modules';
import 'swiper/css';
import PageHero from '../components/PageHero';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import StatStrip from '../components/StatStrip';
import CTA from '../components/CTA';
import usePageTitle from '../hooks/usePageTitle';
import { CASE_STUDIES, ABOUT_STATS } from '../utils/constants';
import { PROJECT_MEDIA } from '../utils/projectMedia';

const CATEGORIES = ['All', 'Metal Roofing', 'Asphalt Roofing', 'Flat Roofing', 'Commercial Roofing', 'Luxury Homes'];

export default function Projects() {
  usePageTitle('Our Projects');
  const [active, setActive] = useState('All');
  const [selected, setSelected] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);

  const filtered = useMemo(
    () => (active === 'All' ? PROJECT_MEDIA : PROJECT_MEDIA.filter((p) => p.category === active)),
    [active]
  );

  const openProject = useCallback((project) => {
    setActiveIndex(0);
    setSelected(project);
  }, []);

  const closeProject = useCallback(() => setSelected(null), []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeProject();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [selected, closeProject]);

  return (
    <>
      <PageHero
        eyebrow="Our Portfolio"
        title={
          <>
            Work That Speaks
            <br />
            <span className="bg-gradient-to-r from-primary-light via-red-400 to-amber-300 bg-clip-text text-transparent">
              For Itself.
            </span>
          </>
        }
        text="A selection of the residential and commercial projects we're proudest of — 2,500+ roofs installed, each one built to a standard we stand behind."
      />

      <section className="relative py-24 lg:py-32">
        <div className="grid-lines absolute inset-0 opacity-[0.3]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionHeading
              align="left"
              eyebrow="Project Gallery"
              title="Recent Roofing Projects"
              text="Filter by type to see the range of work our crews deliver."
              className="max-w-xl"
            />
            <Reveal direction="up" delay={0.1}>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActive(cat)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                      active === cat
                        ? 'bg-primary text-white shadow-glow'
                        : 'border border-line bg-white text-charcoal hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </Reveal>
          </div>

          <motion.div layout className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((project) => (
                <motion.article
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => openProject(project)}
                  className="group relative cursor-pointer overflow-hidden rounded-[1.75rem] shadow-card transition-shadow duration-500 hover:shadow-float"
                >
                  {project.media[0].type === 'image' ? (
                    <img
                      src={project.media[0].url}
                      alt={project.title}
                      className="aspect-[4/3] w-full object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={project.media[0].url}
                      muted
                      playsInline
                      preload="metadata"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <span className="inline-block rounded-full bg-white/15 px-3 py-1 font-display text-[0.65rem] font-bold uppercase tracking-wider text-white backdrop-blur">
                      {project.category}
                    </span>
                    <h3 className="mt-3 font-display text-xl font-bold text-white">{project.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
                      <MapPin className="h-3.5 w-3.5" /> {project.meta}
                    </p>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 && (
            <p className="mt-14 text-center text-sm text-muted">No projects to display yet.</p>
          )}
        </div>
      </section>

      <StatStrip stats={ABOUT_STATS} />

      <section className="relative bg-mist/60 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="Case Studies"
            title="Complex Projects, Solved Properly"
            text="Real challenges, real solutions, measurable results — straight from our project files."
          />
          <div className="mt-16 space-y-10">
            {CASE_STUDIES.map((study, i) => (
              <Reveal key={study.id} direction="up" delay={0.05 * (i % 2)}>
                <article className="grid overflow-hidden rounded-[2rem] border border-line bg-white shadow-card lg:grid-cols-[1fr_1.1fr]">
                  <div className={`relative min-h-80 overflow-hidden ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <img
                      src={study.image}
                      alt={study.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.1s] ease-out hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-6 left-6 rounded-2xl bg-white/95 px-5 py-3 shadow-card backdrop-blur">
                      <div className="font-display text-sm font-bold text-ink">{study.client}</div>
                      <div className="text-xs text-muted">{study.location}</div>
                    </div>
                  </div>
                  <div className={`flex flex-col justify-center p-9 lg:p-12 ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-red-50 px-3 py-1 font-display text-[0.65rem] font-bold uppercase tracking-wider text-primary">
                        Case Study
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-bold text-ink">{study.title}</h3>
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                      <span className="flex items-center gap-1.5">
                        <Ruler className="h-4 w-4 text-primary" /> {study.scope}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary" /> {study.duration}
                      </span>
                    </div>
                    <div className="mt-7 space-y-5">
                      <div className="flex items-start gap-4">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-primary">
                          <Target className="h-4.5 w-4.5" />
                        </span>
                        <div>
                          <div className="text-sm font-bold text-ink">The Challenge</div>
                          <p className="mt-1 text-sm leading-relaxed text-muted">{study.challenge}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-600">
                          <Lightbulb className="h-4.5 w-4.5" />
                        </span>
                        <div>
                          <div className="text-sm font-bold text-ink">Our Solution</div>
                          <p className="mt-1 text-sm leading-relaxed text-muted">{study.solution}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                          <TrendingUp className="h-4.5 w-4.5" />
                        </span>
                        <div>
                          <div className="text-sm font-bold text-ink">The Result</div>
                          <p className="mt-1 text-sm leading-relaxed text-muted">{study.result}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeProject}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.title} gallery`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 24 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem] bg-ink shadow-float"
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-lg font-bold text-white">{selected.title}</h3>
                  <p className="mt-0.5 text-xs text-white/50">{selected.meta}</p>
                </div>
                <button
                  onClick={closeProject}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-300 hover:bg-white/20"
                  aria-label="Close project gallery"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative flex-1 overflow-hidden">
                <Swiper
                  modules={[Keyboard]}
                  keyboard={{ enabled: true }}
                  slidesPerView={1}
                  speed={500}
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                  }}
                  onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                  className="h-full"
                >
                  {selected.media.map((item, i) => (
                    <SwiperSlide key={item.id} className="!h-full">
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={`${selected.title} — photo ${i + 1}`}
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />
                      ) : activeIndex === i ? (
                        <video
                          src={item.url}
                          controls
                          autoPlay
                          playsInline
                          preload="auto"
                          className="h-full w-full bg-black object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-black/40">
                          <Play className="h-14 w-14 text-white/50" />
                        </div>
                      )}
                    </SwiperSlide>
                  ))}
                </Swiper>

                {selected.media.length > 1 && (
                  <>
                    <button
                      onClick={() => swiperRef.current?.slidePrev()}
                      className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-all duration-300 hover:bg-white/20"
                      aria-label="Previous media"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => swiperRef.current?.slideNext()}
                      className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-all duration-300 hover:bg-white/20"
                      aria-label="Next media"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 border-t border-white/10 px-6 py-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  {activeIndex + 1} / {selected.media.length}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CTA />
    </>
  );
}
