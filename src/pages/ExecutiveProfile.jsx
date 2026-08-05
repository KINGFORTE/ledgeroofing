import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Briefcase,
  GraduationCap,
  BadgeCheck,
  Award,
  Quote,
  Trophy,
  ListChecks,
  ArrowRight,
  Home,
} from 'lucide-react';

const LinkedInIcon = () => (
  <svg viewBox="0 0 448 512" className="h-4 w-4 fill-current" role="img" aria-label="LinkedIn">
    <path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z" />
  </svg>
);
import PageHero from '../components/PageHero';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import ExecutiveCard from '../components/ExecutiveCard';
import CTA from '../components/CTA';
import usePageTitle from '../hooks/usePageTitle';
import { EXECUTIVES } from '../utils/constants';
import { staggerContainer, fadeUp } from '../utils/motion';

export default function ExecutiveProfile() {
  const { slug } = useParams();
  const executive = EXECUTIVES.find((e) => e.slug === slug);

  usePageTitle(executive ? `${executive.name} — Leadership` : 'Leadership');

  if (!executive) {
    return <Navigate to="/leadership" replace />;
  }

  const others = EXECUTIVES.filter((e) => e.slug !== executive.slug);

  return (
    <>
      <PageHero
        eyebrow="Leadership Profile"
        title={
          <>
            {executive.name.split(' ')[0]} <span className="text-red-400">{executive.name.split(' ')[1]}</span>
          </>
        }
        text={`${executive.role} at Ledge Roofing. ${executive.shortBio}`}
      />

      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="grid-lines absolute inset-0 opacity-[0.3]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <Reveal direction="right">
              <div className="lg:sticky lg:top-28">
                <div className="relative">
                  <img
                    src={executive.image}
                    alt={`${executive.name}, ${executive.role} at Ledge Roofing`}
                    className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-float"
                  />
                  <span className="absolute right-5 top-5 rounded-full bg-white/90 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-primary backdrop-blur">
                    {executive.role}
                  </span>
                </div>

                <div className="mt-8 rounded-3xl border border-line bg-white p-7 shadow-card">
                  <h3 className="font-display text-lg font-bold text-ink">Quick Facts</h3>
                  <ul className="mt-5 space-y-4 text-sm">
                    <li className="flex items-center gap-3">
                      <Briefcase className="h-4.5 w-4.5 shrink-0 text-primary" />
                      <span className="font-semibold text-charcoal">{executive.role}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Award className="h-4.5 w-4.5 shrink-0 text-primary" />
                      <span className="text-charcoal">{executive.yearsExperience}+ years in roofing</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <GraduationCap className="h-4.5 w-4.5 shrink-0 text-primary" />
                      <span className="text-charcoal">{executive.education}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <BadgeCheck className="h-4.5 w-4.5 shrink-0 text-primary" />
                      <span className="text-charcoal">{executive.certifications.length} professional certifications</span>
                    </li>
                  </ul>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <a
                      href={`mailto:${executive.email}`}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-semibold text-charcoal transition-all duration-300 hover:border-primary hover:text-primary"
                    >
                      <Mail className="h-4 w-4" /> Email
                    </a>
                    <a
                      href={executive.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white transition-all duration-300 hover:bg-primary-dark"
                    >
                      <LinkedInIcon /> LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>

            <div>
              <Reveal direction="up">
                <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">{executive.name}</h1>
                <p className="mt-2 font-semibold text-primary">{executive.role}</p>
              </Reveal>
              <div className="mt-8 space-y-5">
                {executive.bio.map((paragraph, i) => (
                  <Reveal key={i} direction="up" delay={0.05 * (i + 1)}>
                    <p className="text-base leading-relaxed text-muted">{paragraph}</p>
                  </Reveal>
                ))}
              </div>

              <Reveal direction="up" delay={0.2} className="mt-10">
                <div className="rounded-3xl border-l-4 border-primary bg-mist/70 p-8">
                  <Quote className="h-8 w-8 text-primary/30" />
                  <p className="mt-4 font-display text-xl font-semibold leading-relaxed text-ink">
                    “{executive.philosophy}”
                  </p>
                  <div className="mt-5 text-sm font-bold text-primary">— {executive.name}</div>
                </div>
              </Reveal>

              <Reveal direction="up" delay={0.15} className="mt-12">
                <h2 className="font-display text-2xl font-bold text-ink">What {executive.name.split(' ')[0]} Does</h2>
                <motion.ul
                  variants={staggerContainer(0.06)}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-60px' }}
                  className="mt-6 grid gap-4 sm:grid-cols-2"
                >
                  {executive.responsibilities.map((item) => (
                    <motion.li
                      key={item}
                      variants={fadeUp}
                      className="flex items-start gap-3 rounded-2xl border border-line bg-white p-5 shadow-card"
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-primary">
                        <ListChecks className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium leading-relaxed text-charcoal">{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-mist/60 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Credentials"
                title="Certifications & Accreditations"
                text="Industry-recognized credentials earned through rigorous, ongoing training."
                className="max-w-none"
              />
              <motion.ul
                variants={staggerContainer(0.06)}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                className="mt-8 space-y-3.5"
              >
                {executive.certifications.map((cert) => (
                  <motion.li
                    key={cert}
                    variants={fadeUp}
                    className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-4 shadow-card"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-glow">
                      <BadgeCheck className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-charcoal">{cert}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            <div>
              <SectionHeading
                align="left"
                eyebrow="Track Record"
                title="Key Achievements"
                text="Results that speak for themselves."
                className="max-w-none"
              />
              <motion.ul
                variants={staggerContainer(0.06)}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                className="mt-8 space-y-3.5"
              >
                {executive.achievements.map((item) => (
                  <motion.li
                    key={item}
                    variants={fadeUp}
                    className="flex items-start gap-3.5 rounded-2xl border border-line bg-white p-4 shadow-card"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-600">
                      <Trophy className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold leading-relaxed text-charcoal">{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-primary/5 blur-[120px]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="Signature Work"
            title="Major Projects & Focus"
            text="Highlights of the work that defines this leader's impact."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {executive.majorProjects.map((project, i) => (
              <Reveal key={project} direction="up" delay={i * 0.08}>
                <div className="group h-full rounded-2xl border border-line bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-float">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                    <Home className="h-5 w-5" />
                  </span>
                  <p className="mt-5 text-sm font-semibold leading-relaxed text-charcoal">{project}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal direction="up" delay={0.15} className="mt-12">
            <div className="rounded-[2rem] bg-ink p-10 text-white shadow-float">
              <h3 className="font-display text-2xl font-bold">A Personal Note</h3>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/75">{executive.personalMessage}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative bg-mist/60 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="Leadership Team"
            title="Meet The Rest Of The Team"
            text="Every leader at Ledge Roofing shares the same standard — do the job right, and stand behind it."
          />
          <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((executive, i) => (
              <ExecutiveCard key={executive.slug} executive={executive} delay={i * 0.08} />
            ))}
          </div>
          <Reveal direction="up" delay={0.2} className="mt-12 text-center">
            <Link
              to="/leadership"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark"
            >
              Back To Leadership <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <CTA />
    </>
  );
}
