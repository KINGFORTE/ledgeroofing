import { motion } from 'framer-motion';
import { ChevronRight, ClipboardList, FileText, HardHat, PartyPopper } from 'lucide-react';
import SectionHeading from './SectionHeading';
import Reveal from './Reveal';
import { PROCESS_STEPS } from '../utils/constants';
import { staggerContainer, fadeUp } from '../utils/motion';

const icons = [ClipboardList, FileText, HardHat, PartyPopper];

export default function Process() {
  return (
    <section id="process" className="relative scroll-mt-24 bg-mist/60 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="How It Works"
          title="A Simple, Stress-Free Process"
          text="Four clear steps from first call to final inspection. No surprises, no jargon — just honest roofing done right."
        />

        <div className="relative mt-20">
          <div className="absolute left-0 right-0 top-7 hidden h-0.5 bg-line lg:block" aria-hidden="true" />
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-7 hidden h-0.5 origin-left bg-gradient-to-r from-primary via-primary-light to-amber-400 lg:block"
            aria-hidden="true"
          />

          <motion.ol
            variants={staggerContainer(0.15)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="relative grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
          >
            {PROCESS_STEPS.map((step, i) => {
              const Icon = icons[i];
              return (
                <motion.li key={step.step} variants={fadeUp} className="group relative">
                  <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-white shadow-float transition-all duration-500 group-hover:-translate-y-1 group-hover:bg-primary group-hover:shadow-glow lg:mx-0">
                    <Icon className="h-6 w-6" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary font-display text-[0.65rem] font-bold text-white ring-4 ring-mist transition-colors duration-500 group-hover:bg-ink">
                      {step.step}
                    </span>
                  </div>

                  <div className="mt-6 text-center lg:text-left">
                    <h3 className="font-display text-lg font-bold text-ink">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
                  </div>

                  {i < PROCESS_STEPS.length - 1 && (
                    <span className="absolute -right-4 top-3 hidden h-8 w-8 items-center justify-center rounded-full bg-white text-muted shadow-card lg:flex">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </motion.li>
              );
            })}
          </motion.ol>
        </div>

        <Reveal direction="up" delay={0.3} className="mt-16 text-center">
          <p className="text-sm text-muted">
            Average project turnaround: <span className="font-semibold text-ink">1–3 days</span>. Faster for
            emergency repairs.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
