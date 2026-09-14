import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, BadgeCheck, Clock, ArrowRight, Phone } from 'lucide-react';
import Seo from '../components/Seo';
import PageHero from '../components/PageHero';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import CTA from '../components/CTA';
import { SERVICE_AREAS, COMPANY } from '../utils/constants';
import { staggerContainer, fadeUp } from '../utils/motion';

const AREA_POINTS = [
  {
    icon: ShieldCheck,
    title: 'Licensed & Insured Crews',
    text: 'Fully certified, background-checked teams working in every area we serve.',
  },
  {
    icon: BadgeCheck,
    title: 'Written Workmanship Warranty',
    text: 'Every installation is covered in writing — not just the materials, the work too.',
  },
  {
    icon: Clock,
    title: '24/7 Emergency Response',
    text: 'Storm damage and leaks get an around-the-clock response across all service areas.',
  },
];

export default function ServiceAreas() {
  const description =
    'Ledge Roofing serves Lagos and Southwest Nigeria — roof installation, repair, replacement and 24/7 emergency roofing across ten states, including Ogun, Oyo, Osun, Ondo and Abuja (FCT).';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RoofingContractor',
    '@id': 'https://ledgeroofing.org/#organization',
    name: 'Ledge Roofing',
    url: 'https://ledgeroofing.org/service-areas',
    telephone: '+2347036588568',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '221 Ikorodu Road, Ilupeju',
      addressLocality: 'Lagos',
      addressCountry: 'NG',
    },
    areaServed: SERVICE_AREAS.map((area) => ({ '@type': 'State', name: area })),
  };

  return (
    <>
      <Seo
        title="Roofing Service Areas | Ledge Roofing — Lagos & Southwest Nigeria"
        description={description}
        path="/service-areas"
        jsonLd={jsonLd}
      />

      <PageHero
        eyebrow="Where We Work"
        title={
          <>
            Roofing Service
            <br />
            <span className="bg-gradient-to-r from-primary-light via-red-400 to-amber-300 bg-clip-text text-transparent">
              Areas.
            </span>
          </>
        }
        text="Ledge Roofing is based in Lagos and works across Southwest Nigeria — bringing licensed crews, premium materials and honest pricing to every community we serve."
      />

      <section className="relative py-24 lg:py-32">
        <div className="grid-lines absolute inset-0 opacity-[0.3]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="Communities We Serve"
            title="Roofing Across Lagos & Southwest Nigeria"
            text="Residential and commercial roofing — new installations, repairs, full replacements and emergency response — whenever you need it."
          />
          <motion.div
            variants={staggerContainer(0.06)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          >
            {SERVICE_AREAS.map((area) => (
              <motion.div
                key={area}
                variants={fadeUp}
                className="group rounded-2xl border border-line bg-white p-7 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-float"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-glow">
                  <MapPin className="h-6 w-6" />
                </span>
                <h2 className="mt-5 font-display text-lg font-bold text-ink">{area}</h2>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Roof installation, repair, replacement &amp; 24/7 emergency roofing
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative bg-mist/60 py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="The Ledge Standard"
            title="The Same Standard Everywhere We Work"
            text="From Lagos Island to Ogun, Oyo and beyond — the crews, materials and warranties never change."
          />
          <motion.div
            variants={staggerContainer(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-14 grid gap-6 md:grid-cols-3"
          >
            {AREA_POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <motion.div
                  key={point.title}
                  variants={fadeUp}
                  className="rounded-2xl border border-line bg-white p-8 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float"
                >
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
                    <Icon className="h-7 w-7" />
                  </span>
                  <h3 className="mt-6 font-display text-xl font-bold text-ink">{point.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{point.text}</p>
                </motion.div>
              );
            })}
          </motion.div>

          <Reveal direction="up" className="mt-14 text-center">
            <p className="mx-auto max-w-2xl font-display text-2xl font-bold leading-snug text-ink">
              Not sure where to start? Book a free inspection and we’ll come to you.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark"
              >
                Get Free Estimate <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={COMPANY.phoneHref}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-7 py-3.5 text-sm font-semibold text-ink transition-all duration-300 hover:border-primary hover:text-primary"
              >
                <Phone className="h-4 w-4" /> WhatsApp: {COMPANY.phone}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <CTA />
    </>
  );
}