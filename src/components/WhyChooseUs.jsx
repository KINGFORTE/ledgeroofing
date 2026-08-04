import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import AnimatedCounter from './AnimatedCounter';
import { WHY_CHOOSE_US, ABOUT_STATS, ABOUT_IMAGES } from '../utils/constants';
import { ICONS } from '../utils/icons';
import { staggerContainer, fadeUp } from '../utils/motion';

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="relative scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal direction="right" className="relative">
            <div className="relative">
              <img
                src={ABOUT_IMAGES.patternHouse}
                alt="Lege Roofing crew working on a steel structure at Nautica Beach"
                className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-float"
                loading="lazy"
              />
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-ink/50 via-transparent to-transparent" />

              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="glass absolute -bottom-6 -right-4 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-float animate-float sm:-right-8"
              >
                <span className="relative flex h-12 w-12 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-glow">
                    <ShieldCheck className="h-6 w-6" />
                  </span>
                </span>
                <div>
                  <div className="font-display text-xl font-bold text-ink">Licensed &amp; Insured</div>
                  <div className="text-xs font-medium text-muted">Workmanship guaranteed</div>
                </div>
              </motion.div>

              <div className="absolute left-6 top-6 rounded-2xl bg-ink/80 px-5 py-3 text-white backdrop-blur">
                <div className="font-display text-3xl font-bold">
                  <AnimatedCounter end={98} suffix="%" />
                </div>
                <div className="text-xs font-medium text-white/70">Customer satisfaction</div>
              </div>
            </div>
          </Reveal>

          <div>
            <SectionHeading
              align="left"
              eyebrow="Why Choose Us"
              title="Built On Trust. Backed By Quality."
              text="We treat every roof like it’s our own. That’s why homeowners and businesses keep choosing Lege Roofing — project after project."
              className="max-w-none"
            />

            <motion.div
              variants={staggerContainer(0.08)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              className="mt-10 grid gap-5 sm:grid-cols-2"
            >
              {WHY_CHOOSE_US.map((feature) => {
                const Icon = ICONS[feature.icon];
                return (
                  <motion.div
                    key={feature.title}
                    variants={fadeUp}
                    className="group flex items-start gap-4 rounded-2xl border border-line bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-float"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-glow">
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-ink">{feature.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{feature.text}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="mt-20 bg-ink lg:mt-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid grid-cols-2 gap-y-10 py-14 text-center lg:grid-cols-4">
            {ABOUT_STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.08} className="relative">
                <div className="font-display text-4xl font-bold text-white sm:text-5xl">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="mt-2 text-sm font-semibold uppercase tracking-wider text-red-300">{stat.label}</div>
                <div className="mt-1 text-xs text-white/50">{stat.note}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
