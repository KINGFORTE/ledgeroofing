import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Quote, ArrowRight, HeartHandshake, GraduationCap } from 'lucide-react';
import PageHero from '../components/PageHero';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import ExecutiveCard from '../components/ExecutiveCard';
import CTA from '../components/CTA';
import usePageTitle from '../hooks/usePageTitle';
import { EXECUTIVES, LEADERSHIP_TIMELINE } from '../utils/constants';
import { staggerContainer, fadeUp } from '../utils/motion';

export default function Leadership() {
  usePageTitle('Leadership');
  const ceo = EXECUTIVES[0];

  return (
    <>
      <PageHero
        eyebrow="Our Leadership"
        title={
          <>
            The Team Behind
            <br />
            <span className="bg-gradient-to-r from-primary-light via-red-400 to-amber-300 bg-clip-text text-transparent">
              Every Great Roof.
            </span>
          </>
        }
        text="Ledge Roofing is led by a team of operators, craftsmen and customer advocates who have spent decades building the region's most trusted name in roofing."
      />

      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="grid-lines absolute inset-0 opacity-[0.3]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
            <Reveal direction="right" className="relative">
              <div className="relative">
                <img
                  src={ceo.image}
                  alt={`${ceo.name}, ${ceo.role} at Ledge Roofing`}
                  className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-float"
                  loading="lazy"
                />
                <div className="absolute -bottom-6 -right-2 flex items-center gap-3 rounded-2xl bg-ink px-6 py-4 text-white shadow-float sm:-right-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-glow">
                    <Quote className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-display text-lg font-bold leading-tight">Since 2013</div>
                    <div className="text-xs text-white/60">A decade of craft</div>
                  </div>
                </div>
              </div>
            </Reveal>

            <div>
              <SectionHeading
                align="left"
                eyebrow="Managing Director's Message"
                title="Built One Roof At A Time"
                text="A message from the Managing Director of Ledge Roofing."
                className="max-w-none"
              />
              <Reveal direction="up" delay={0.15}>
                <p className="mt-6 text-lg leading-relaxed text-charcoal">
                  {ceo.philosophy}
                </p>
              </Reveal>
              <Reveal direction="up" delay={0.2}>
                <p className="mt-4 text-base leading-relaxed text-muted">
                  {ceo.bio[0]}
                </p>
              </Reveal>
              <Reveal direction="up" delay={0.25} className="mt-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-white shadow-glow">
                  {ceo.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <div className="font-display text-lg font-bold text-ink">{ceo.name}</div>
                  <div className="text-sm font-medium text-primary">{ceo.role}</div>
                </div>
              </Reveal>
              <Reveal direction="up" delay={0.3} className="mt-8">
                <Link
                  to={`/leadership/${ceo.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark"
                >
                  Read Oluyemisi's Full Story <ArrowRight className="h-4 w-4" />
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-mist/60 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="Leadership Team"
            title="Meet The Executives"
            text="Five leaders, one standard: do the job right, stand behind it, and treat every customer like family."
          />
          <div className="mt-16 grid gap-7 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {EXECUTIVES.map((executive, i) => (
              <ExecutiveCard key={executive.slug} executive={executive} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-primary/5 blur-[120px]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading eyebrow="The Journey" title="How The Team Was Built" text="Milestones that shaped today's leadership bench." />
          <div className="relative mt-16">
            <div className="absolute bottom-0 left-6 top-0 hidden w-0.5 bg-line sm:block" aria-hidden="true" />
            <div className="space-y-10">
              {LEADERSHIP_TIMELINE.map((item, i) => (
                <Reveal key={item.year} direction={i % 2 === 0 ? 'right' : 'left'} delay={0.05 * (i % 2)}>
                  <div className="relative sm:flex sm:gap-8 sm:pl-16">
                    <span className="absolute left-0 top-1 hidden h-12 w-12 items-center justify-center rounded-2xl bg-primary font-display text-sm font-bold text-white shadow-glow sm:flex">
                      {item.year}
                    </span>
                    <div className="ml-14 rounded-2xl border border-line bg-white p-7 shadow-card sm:ml-0 sm:flex-1">
                      <span className="font-display text-sm font-bold text-primary sm:hidden">{item.year}</span>
                      <h3 className="mt-1 font-display text-xl font-bold text-ink sm:mt-0">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-ink py-24 text-white lg:py-28">
        <div className="grid-lines-dark absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <motion.div
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid gap-8 md:grid-cols-2"
          >
            <motion.div variants={fadeUp} className="flex items-start gap-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
                <HeartHandshake className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold">A Leadership Team That's In The Field</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  Our executives don't just run the company — they show up on job sites. From MD Oluyemisi
                  walking final inspections to Head of Construction Adams personally handling the toughest
                  repairs, leadership
                  lives where the work happens.
                </p>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="flex items-start gap-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300">
                <GraduationCap className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold">Building The Next Generation</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  From the crew training academy to mentorship programs, our leadership invests in the people who
                  will carry the craft forward — more than 60 professionals trained and counting.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <CTA />
    </>
  );
}
