import { motion } from 'framer-motion';
import { Star, Quote, ShieldCheck, BadgeCheck } from 'lucide-react';
import PageHero from '../components/PageHero';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import CTA from '../components/CTA';
import usePageTitle from '../hooks/usePageTitle';
import { TESTIMONIALS } from '../utils/constants';
import { staggerContainer, fadeUp } from '../utils/motion';

function Stars({ count = 5, className = 'h-4 w-4' }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className={`${className} fill-amber-400 text-amber-400`} />
      ))}
    </div>
  );
}

const PLATFORMS = [
  { name: 'Google Reviews', rating: '4.9', count: '820+ reviews' },
  { name: 'Yelp', rating: '5.0', count: '310+ reviews' },
  { name: 'Facebook', rating: '5.0', count: '560+ reviews' },
  { name: 'Better Business Bureau', rating: 'A+', count: 'Accredited since 2008' },
];

export default function Testimonials() {
  usePageTitle('Customer Reviews');

  return (
    <>
      <PageHero
        eyebrow="Customer Reviews"
        title={
          <>
            Don't Just Take
            <br />
            <span className="bg-gradient-to-r from-primary-light via-red-400 to-amber-300 bg-clip-text text-transparent">
              Our Word For It.
            </span>
          </>
        }
        text="More than 800 five-star reviews from the homeowners and businesses we've served — and a 98% satisfaction rate we work hard to protect."
      />

      <section className="relative bg-ink py-16 text-white">
        <div className="grid-lines-dark absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <motion.div
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {PLATFORMS.map((platform) => (
              <motion.div key={platform.name} variants={fadeUp} className="text-center">
                <div className="font-display text-4xl font-bold text-red-300">{platform.rating}</div>
                <div className="mt-2 flex justify-center">
                  <Stars className="h-3.5 w-3.5" />
                </div>
                <div className="mt-2 text-sm font-semibold">{platform.name}</div>
                <div className="text-xs text-white/50">{platform.count}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative py-24 lg:py-32">
        <div className="grid-lines absolute inset-0 opacity-[0.3]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="What Customers Say"
            title="Real Stories From Real Roofs"
            text="Every review below came from a real project — and every project got the same treatment: done right, and cleaned up after."
          />
          <motion.div
            variants={staggerContainer(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {TESTIMONIALS.map((t) => (
              <motion.figure
                key={t.id}
                variants={fadeUp}
                className="group relative flex h-full flex-col rounded-[1.75rem] border border-line bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float"
              >
                <Quote className="h-8 w-8 text-red-100 transition-colors duration-300 group-hover:text-primary/25" />
                <div className="mt-4 flex items-center justify-between">
                  <Stars />
                  <span className="text-xs font-semibold text-muted">{t.role}</span>
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-charcoal">
                  “{t.review}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="h-11 w-11 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div>
                    <div className="text-sm font-bold text-ink">{t.name}</div>
                    <div className="text-xs text-muted">{t.location}</div>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative bg-mist/60 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <Reveal direction="right">
              <div className="h-full rounded-[2rem] border border-line bg-white p-9 shadow-card">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
                  <ShieldCheck className="h-7 w-7" />
                </span>
                <h3 className="mt-6 font-display text-2xl font-bold text-ink">Our Promise Behind The Reviews</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  Great reviews don't happen by accident. They happen because every project ships with the same
                  discipline: certified crews, a written workmanship warranty, a final walkthrough you approve, and
                  a site left cleaner than we found it. If anything isn't right, we make it right — fast.
                </p>
              </div>
            </Reveal>
            <Reveal direction="left">
              <div className="h-full rounded-[2rem] border border-line bg-white p-9 shadow-card">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-600">
                  <BadgeCheck className="h-7 w-7" />
                </span>
                <h3 className="mt-6 font-display text-2xl font-bold text-ink">Want To Join Them?</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  The next five-star review could be about your roof. Start with a free, no-obligation inspection
                  and experience the difference that comes from 25+ years of doing this right.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}
