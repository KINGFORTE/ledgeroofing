import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Eye, ArrowRight, Trophy, Award, MapPin } from 'lucide-react';
import PageHero from '../components/PageHero';
import AboutStory from '../components/About';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import ExecutiveCard from '../components/ExecutiveCard';
import CTA from '../components/CTA';
import usePageTitle from '../hooks/usePageTitle';
import {
  MISSION,
  VISION,
  CORE_VALUES,
  COMPANY_TIMELINE,
  CERTIFICATIONS,
  AWARDS,
  EXECUTIVES,
} from '../utils/constants';
import { ICONS } from '../utils/icons';
import { staggerContainer, fadeUp } from '../utils/motion';

export default function About() {
  usePageTitle('About Us');

  return (
    <>
      <PageHero
        eyebrow="About Lege Roofing"
        title={
          <>
            Craftsmanship You Can Trust,
            <br />
            <span className="bg-gradient-to-r from-primary-light via-red-400 to-amber-300 bg-clip-text text-transparent">
              Since 2013.
            </span>
          </>
        }
        text="For more than a decade, we have protected homes and businesses with roofs built on honesty, precision and pride. Here is the story behind the roofs — and the people who build them."
      />

      <AboutStory />

      <section className="relative py-24 lg:py-32">
        <div className="grid-lines absolute inset-0 opacity-[0.3]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {[MISSION, VISION].map((item, i) => {
              const Icon = i === 0 ? Target : Eye;
              return (
                <Reveal key={item.title} direction="up" delay={i * 0.1}>
                  <div className="group relative overflow-hidden rounded-[2rem] border border-line bg-white p-10 shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-float">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-2xl" aria-hidden="true" />
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
                      <Icon className="h-7 w-7" />
                    </span>
                    <h2 className="mt-6 font-display text-2xl font-bold text-ink">{item.title}</h2>
                    <p className="mt-4 text-base leading-relaxed text-muted">{item.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative bg-mist/60 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="What We Stand For"
            title="Our Core Values"
            text="Six principles guide every estimate, every nail and every handshake."
          />
          <motion.div
            variants={staggerContainer(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {CORE_VALUES.map((value) => {
              const Icon = ICONS[value.icon];
              return (
                <motion.div
                  key={value.title}
                  variants={fadeUp}
                  className="group rounded-2xl border border-line bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-float"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-glow">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold text-ink">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{value.text}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute -left-20 top-1/3 h-80 w-80 rounded-full bg-primary/5 blur-[120px]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading eyebrow="Our Journey" title="Company History & Milestones" text="From a one-truck start to the region’s most trusted roofing company." />
          <div className="relative mt-16">
            <div className="absolute bottom-0 left-6 top-0 hidden w-0.5 bg-line sm:block" aria-hidden="true" />
            <div className="space-y-10">
              {COMPANY_TIMELINE.map((item, i) => (
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

      <section className="relative bg-mist/60 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="Why Choose Us"
            title="Built On Trust. Backed By Quality."
            text="We treat every roof like it’s our own — that’s why homeowners and businesses keep choosing Lege Roofing."
          />
          <motion.div
            variants={staggerContainer(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[
              'Licensed & fully insured crews on every job',
              'Workmanship warranty on every project',
              'Free, no-obligation inspections & quotes',
              'Manufacturer-certified installers',
              'Clean, protected and safe job sites',
              'On-time, on-budget project delivery',
            ].map((point) => (
                <motion.div
                  key={point}
                  variants={fadeUp}
                  className="flex items-start gap-4 rounded-2xl border border-line bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-glow">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-medium leading-relaxed text-charcoal">{point}</p>
                </motion.div>
              ))}
          </motion.div>

          <div className="mt-16 grid gap-10 lg:grid-cols-2">
            <Reveal direction="right">
              <div className="h-full rounded-[2rem] border border-line bg-white p-9 shadow-card">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-primary">
                  <Award className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-ink">Certifications</h3>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {CERTIFICATIONS.map((cert) => (
                    <li key={cert} className="flex items-center gap-2.5 text-sm font-medium text-charcoal">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal direction="left">
              <div className="h-full rounded-[2rem] border border-line bg-white p-9 shadow-card">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-600">
                  <Trophy className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-ink">Awards & Recognition</h3>
                <ul className="mt-6 space-y-4">
                  {AWARDS.map((award) => (
                    <li key={award.title} className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 font-display text-xs font-bold text-primary">
                        {award.year}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-ink">{award.title}</div>
                        <div className="text-xs text-muted">{award.org}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              align="left"
              eyebrow="The People Behind The Roofs"
              title="Meet Our Leadership"
              text="A team of craftsmen and operators who built Lege Roofing into what it is today."
              className="max-w-2xl"
            />
            <Reveal direction="up" delay={0.15}>
              <Link
                to="/leadership"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark"
              >
                View All Leaders <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
          <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {EXECUTIVES.slice(0, 5).map((executive, i) => (
              <ExecutiveCard key={executive.slug} executive={executive} delay={i * 0.08} />
            ))}
          </div>
          <Reveal direction="up" delay={0.2} className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Proudly serving 10 communities across the region
            </span>
          </Reveal>
        </div>
      </section>

      <CTA />
    </>
  );
}
