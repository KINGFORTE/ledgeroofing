import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, ShieldCheck, Star, Home as HomeIcon, CheckCircle2, ThumbsUp } from 'lucide-react';
import Button from './Button';
import AnimatedCounter from './AnimatedCounter';
import medburyVideo from '../../project media for web - Copy/Medbury Hospital/videos/IMG_7538.MP4';
import nigerDockVideo from '../../project media for web - Copy/Niger Dock Factory_/videos/IMG_6799.MP4';
import kokoBeachVideo from '../../project media for web - Copy/koko beach resort/videos/IMG_7697.MP4';

const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } },
});

const heroStats = [
  { icon: HomeIcon, value: 13, suffix: '+', label: 'Years Experience', cls: 'left-[-2rem] top-8' },
  { icon: CheckCircle2, value: 250, suffix: '+', label: 'Projects Completed', cls: 'right-[-1.5rem] top-1/4' },
  { icon: ThumbsUp, value: 94, suffix: '%', label: 'Customer Satisfaction', cls: 'left-[-1rem] bottom-10' },
];

const marqueeItems = [
  'Licensed & Insured',
  'Premium Materials',
  'Expert Craftsmanship',
  'Free Estimates',
  '13+ Years Experience',
  '24/7 Emergency Support',
];

const heroVideos = [
  medburyVideo,
  nigerDockVideo,
  kokoBeachVideo,
];

export default function Hero() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const [activeVideo, setActiveVideo] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const blobY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveVideo((current) => (current + 1) % heroVideos.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative flex min-h-screen items-center overflow-hidden bg-ink pt-[120px] pb-16 lg:pb-24"
    >
      <div className="grid-lines-dark absolute inset-0 opacity-50" aria-hidden="true" />
      <motion.div
        style={{ y: blobY }}
        className="absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-primary/25 blur-[140px]"
        aria-hidden="true"
      />
      <div className="absolute right-[-10%] top-1/3 h-[420px] w-[420px] rounded-full bg-amber-400/15 blur-[130px]" aria-hidden="true" />
      <div className="absolute bottom-[-20%] left-1/3 h-[380px] w-[380px] rounded-full bg-primary-light/10 blur-[120px]" aria-hidden="true" />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]"
        viewBox="0 0 1440 800"
        fill="none"
        aria-hidden="true"
      >
        <path d="M0 700 L1440 420" stroke="white" strokeWidth="1" />
        <path d="M0 560 L1440 280" stroke="white" strokeWidth="1" />
        <path d="M220 0 L220 800" stroke="white" strokeWidth="1" opacity="0.5" />
        <path d="M1180 0 L1180 800" stroke="white" strokeWidth="1" opacity="0.5" />
        <path d="M60 0 L420 800" stroke="white" strokeWidth="1" opacity="0.6" />
        <path d="M1380 0 L1020 800" stroke="white" strokeWidth="1" opacity="0.6" />
        <rect x="120" y="120" width="140" height="140" transform="rotate(45 190 190)" stroke="white" strokeWidth="1.5" />
        <rect x="1200" y="520" width="100" height="100" transform="rotate(45 1250 570)" stroke="white" strokeWidth="1.5" />
      </svg>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-16 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8">
        <div>
          <motion.div variants={fadeUp(0.05)} initial="hidden" animate="show" className="glass-dark inline-flex items-center gap-2.5 rounded-full py-2 pl-2 pr-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <ShieldCheck className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-medium text-white/85">Licensed &amp; Insured Roofing Contractor</span>
          </motion.div>

          <motion.h1
            variants={fadeUp(0.15)}
            initial="hidden"
            animate="show"
            className="mt-7 font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[4.4rem]"
          >
            Building Strong
            <br />
            <span className="bg-gradient-to-r from-primary-light via-red-400 to-amber-300 bg-clip-text text-transparent">Roofs.</span>{' '}
            <span className="text-white/90">Protecting Homes.</span>
            <br />
            <span className="text-white/55">Creating Peace of Mind.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp(0.28)}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/70"
          >
            Ledge Roofing delivers premium residential and commercial roofing solutions using expert
            craftsmanship, durable materials, and exceptional customer service. From repairs to complete
            roof replacements, we protect what matters most.
          </motion.p>

          <motion.div variants={fadeUp(0.4)} initial="hidden" animate="show" className="mt-9 flex flex-wrap items-center gap-4">
            <Button size="lg" onClick={() => scrollToSection('contact')}>
              Get Free Estimate
              <ArrowRight className="h-4.5 w-4.5" />
            </Button>
            <Button size="lg" variant="white" onClick={() => navigate('/projects')}>
              <Play className="h-4 w-4 fill-current" />
              View Our Projects
            </Button>
          </motion.div>

          <motion.div variants={fadeUp(0.52)} initial="hidden" animate="show" className="mt-10 flex items-center gap-4">
            <div className="flex items-center gap-1" aria-label="Rated five stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm font-medium text-white/80">
              Trusted by <span className="font-bold text-white">1,500+ Homeowners</span>
            </p>
          </motion.div>
        </div>

        <motion.div
          variants={fadeUp(0.3)}
          initial="hidden"
          animate="show"
          className="relative mx-auto w-full max-w-[560px]"
        >
          <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-primary/40 via-white/5 to-amber-400/30 blur-2xl" aria-hidden="true" />
          <motion.div style={{ y: imgY }} className="relative">
            <div className="group overflow-hidden rounded-[2.25rem] border border-white/10 shadow-float">
              <div className="relative aspect-[4/5] w-full">
                {heroVideos.map((src, index) => (
                  <video
                    key={src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload={index === 0 ? 'auto' : 'metadata'}
                    aria-hidden={index !== activeVideo}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out group-hover:scale-105 ${
                      index === activeVideo ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <source src={src} type="video/mp4" />
                  </video>
                ))}
              </div>
            </div>

            {heroStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`glass absolute hidden rounded-2xl p-4 shadow-float sm:block ${stat.cls} animate-float`}
                style={{ animationDelay: `${i * 0.9}s` }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <stat.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-display text-xl font-bold text-ink">
                      <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2.2} />
                    </div>
                    <div className="text-xs font-medium text-muted">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.15, duration: 0.6 }}
              className="glass-dark absolute -right-4 -top-6 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-float animate-float sm:-right-8"
              style={{ animationDelay: '2.7s' }}
            >
              <span className="relative flex h-10 w-10 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-white/20 animate-pulse-ring" />
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </span>
              </span>
              <div>
                <div className="font-display text-sm font-bold text-white">Licensed &amp; Insured</div>
                <div className="text-[0.7rem] font-medium text-white/60">Fully certified &amp; bonded</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-black/20 py-4 backdrop-blur-sm">
        <div className="overflow-hidden">
          <div className="flex w-max animate-marquee items-center gap-12">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="flex items-center gap-12 whitespace-nowrap">
                <span className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                  {item}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
