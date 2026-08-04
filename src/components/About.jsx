import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Building2 } from 'lucide-react';
import Reveal from './Reveal';
import Button from './Button';
import AnimatedCounter from './AnimatedCounter';
import SectionHeading from './SectionHeading';
import { ABOUT_IMAGES, ABOUT_STATS } from '../utils/constants';

const checkmarks = [
  'Family-owned & operated since 2013',
  'Certified installation crews',
  'Premium manufacturer partners',
  'Clean, protected job sites',
];

export default function About() {
  return (
    <section id="about" className="relative scroll-mt-24 overflow-hidden py-24 lg:py-32">
      <div className="grid-lines absolute inset-0 opacity-[0.35]" aria-hidden="true" />
      <div className="absolute right-[-10%] top-0 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <Reveal direction="right" className="relative">
            <div className="relative mr-4">
              <img
                src={ABOUT_IMAGES.contractor}
                alt="Lege Roofing contractor carrying premium roofing materials on a residential site"
                className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-float"
                loading="lazy"
              />
              <div className="absolute -bottom-8 -right-2 w-2/5 overflow-hidden rounded-[1.5rem] border-[6px] border-white shadow-float sm:-right-6">
                <img
                  src={ABOUT_IMAGES.roofInstall}
                  alt="Roofing crew installing a new standing-seam metal roof"
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="glass absolute -left-4 top-10 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-float animate-float sm:-left-8"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
                  <Building2 className="h-6 w-6" />
                </span>
                <div>
                  <div className="font-display text-2xl font-bold text-ink">
                    <AnimatedCounter end={13} suffix="+" duration={2.2} />
                  </div>
                  <div className="text-xs font-medium text-muted">Years of Excellence</div>
                </div>
              </motion.div>

              <div className="absolute -bottom-5 left-6 flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-white shadow-float">
                <BadgeCheck className="h-4 w-4 text-red-400" />
                <span className="text-xs font-semibold tracking-wide">Free Roof Inspection</span>
              </div>
            </div>
          </Reveal>

          <div>
            <SectionHeading
              align="left"
              eyebrow="About Lege Roofing"
              title="Your Trusted Roofing Partner"
              text="For more than a decade, Lege Roofing has protected homes and businesses across the region. We combine old-school craftsmanship with modern materials and technology to deliver roofs that are as beautiful as they are built to last."
              className="max-w-none"
            />

            <Reveal direction="up" delay={0.15}>
              <ul className="mt-8 grid gap-3.5 sm:grid-cols-2">
                {checkmarks.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium text-charcoal">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-primary">
                      <BadgeCheck className="h-3.5 w-3.5" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal direction="up" delay={0.2} className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {ABOUT_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-line bg-white p-5 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float"
                >
                  <div className="font-display text-2xl font-bold text-primary lg:text-3xl">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="mt-1 text-sm font-semibold text-ink">{stat.label}</div>
                  <div className="text-xs text-muted">{stat.note}</div>
                </div>
              ))}
            </Reveal>

            <Reveal direction="up" delay={0.25} className="mt-10">
              <Link to="/services">
                <Button variant="dark">
                  Learn More About Us
                  <ArrowRight className="h-4.5 w-4.5" />
                </Button>
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
