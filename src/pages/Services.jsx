import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import PageHero from '../components/PageHero';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import FAQItem from '../components/FAQItem';
import CTA from '../components/CTA';
import usePageTitle from '../hooks/usePageTitle';
import {
  SERVICES,
  SERVICE_DETAILS,
  MATERIALS,
  WARRANTY_TERMS,
  PROCESS_STEPS,
  WHY_CHOOSE_US,
  SERVICE_FAQS,
} from '../utils/constants';
import { ICONS } from '../utils/icons';
import { staggerContainer, fadeUp } from '../utils/motion';

export default function ServicesPage() {
  usePageTitle('Roofing Services');

  return (
    <>
      <PageHero
        eyebrow="Our Services"
        title={
          <>
            Roofing Solutions,
            <br />
            <span className="bg-gradient-to-r from-primary-light via-red-400 to-amber-300 bg-clip-text text-transparent">
              From Repair To Full Replace.
            </span>
          </>
        }
        text="Whatever your roof needs — a fast repair, a storm emergency or a brand-new system — our certified crews handle it with precision, premium materials and a workmanship guarantee."
      />

      <section className="relative py-24 lg:py-32">
        <div className="grid-lines absolute inset-0 opacity-[0.3]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="What We Offer"
            title="Our Roofing Services"
            text="Six core services, one standard of excellence. Every project is inspected, warranted and built to last."
          />
          <motion.div
            variants={staggerContainer(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SERVICES.map((service) => {
              const Icon = ICONS[service.icon];
              return (
                <motion.div
                  key={service.id}
                  variants={fadeUp}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-float"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="h-full w-full object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-90" />
                    <span className="absolute bottom-4 left-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-primary shadow-glow backdrop-blur">
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="p-7">
                    <h3 className="font-display text-xl font-bold text-ink transition-colors duration-300 group-hover:text-primary">
                      {service.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted">{service.description}</p>
                    <Link
                      to="/contact"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all duration-300 hover:gap-3.5"
                    >
                      Get a Free Estimate <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="relative bg-mist/60 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="Service Details"
            title="Deep-Dive Into What We Install"
            text="Here is exactly what each service covers — no surprises, no fine print."
          />
          <div className="mt-16 space-y-10">
            {SERVICES.map((service, i) => {
              const detail = SERVICE_DETAILS[service.id];
              const Icon = ICONS[service.icon];
              const flipped = i % 2 === 1;
              return (
                <Reveal key={service.id} direction="up">
                  <div className="grid overflow-hidden rounded-[2rem] border border-line bg-white shadow-card lg:grid-cols-2">
                    <div className={`relative min-h-72 overflow-hidden ${flipped ? 'lg:order-2' : ''}`}>
                      <img
                        src={service.image}
                        alt={detail.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.1s] ease-out hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <span className="absolute left-6 top-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-primary shadow-glow backdrop-blur">
                        <Icon className="h-6 w-6" />
                      </span>
                    </div>
                    <div className={`flex flex-col justify-center p-9 lg:p-12 ${flipped ? 'lg:order-1' : ''}`}>
                      <h3 className="font-display text-2xl font-bold text-ink">{detail.title}</h3>
                      <p className="mt-4 text-sm leading-relaxed text-muted">{detail.text}</p>
                      <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                        {detail.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5 text-sm font-medium text-charcoal">
                            <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Link
                        to="/contact"
                        className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark"
                      >
                        Request This Service <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-24 lg:py-32">
        <div className="grid-lines absolute inset-0 opacity-[0.3]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="Materials"
            title="Premium Materials, Real Warranties"
            text="We install only top-tier systems from leading manufacturers — every one backed by a written warranty."
          />
          <motion.div
            variants={staggerContainer(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {MATERIALS.map((material) => (
              <motion.div
                key={material.name}
                variants={fadeUp}
                className="group overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-float"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={material.image}
                    alt={material.name}
                    className="h-full w-full object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-lg font-bold text-ink transition-colors duration-300 group-hover:text-primary">
                    {material.name}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{material.text}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative bg-mist/60 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="Peace Of Mind"
            title="Backed By Warranty"
            text="Every Ledge Roofing installation is protected — in writing."
          />
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {WARRANTY_TERMS.map((term, i) => {
              const Icon = ICONS[term.icon];
              return (
                <Reveal key={term.title} direction="up" delay={i * 0.08}>
                  <div className="group h-full rounded-[1.75rem] border border-line bg-white p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-float">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-glow">
                      <Icon className="h-7 w-7" />
                    </span>
                    <h3 className="mt-6 font-display text-xl font-bold text-ink">{term.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{term.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="How It Works"
            title="Our Simple 4-Step Process"
            text="From first call to final walkthrough — we make it easy."
          />
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step, i) => (
              <Reveal key={step.step} direction="up" delay={i * 0.08}>
                <div className="group relative h-full rounded-[1.75rem] border border-line bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float">
                  <span className="font-display text-5xl font-bold text-red-100 transition-colors duration-300 group-hover:text-primary/20">
                    {step.step}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-mist/60 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Why Choose Ledge"
                title="Roofing Contractors You Can Trust"
                text="More than a decade of craft, 2,500+ roofs and a reputation built one satisfied customer at a time."
                className="max-w-none"
              />
              <motion.div
                variants={staggerContainer(0.08)}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                className="mt-10 grid gap-5 sm:grid-cols-2"
              >
                {WHY_CHOOSE_US.map((item) => {
                  const Icon = ICONS[item.icon];
                  return (
                    <motion.div
                      key={item.title}
                      variants={fadeUp}
                      className="flex items-start gap-4 rounded-2xl border border-line bg-white p-6 shadow-card"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-glow">
                        <Icon className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <h3 className="font-display text-base font-bold text-ink">{item.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted">{item.text}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            <div>
              <SectionHeading
                align="left"
                eyebrow="FAQ"
                title="Common Questions"
                text="Straight answers to the questions we hear most."
                className="max-w-none"
              />
              <div className="mt-10 space-y-4">
                {SERVICE_FAQS.map((faq, i) => (
                  <FAQItem key={i} question={faq.q} answer={faq.a} delay={i * 0.05} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}
