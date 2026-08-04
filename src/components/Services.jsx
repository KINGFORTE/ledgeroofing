import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import SectionHeading from './SectionHeading';
import Reveal from './Reveal';
import { SERVICES } from '../utils/constants';
import { ICONS } from '../utils/icons';
import { staggerContainer, fadeUp } from '../utils/motion';

export default function Services() {
  return (
    <section id="services" className="relative scroll-mt-24 bg-mist/60 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="What We Do"
          title="Roofing Services Built To Last"
          text="From first inspection to final cleanup, every service is delivered with the same obsession over quality, safety and detail."
        />

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="mt-16 grid gap-7 sm:grid-cols-2 lg:grid-cols-3"
        >
          {SERVICES.map((service) => {
            const Icon = ICONS[service.icon];
            return (
              <motion.article
                key={service.id}
                variants={fadeUp}
                className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-float"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={service.image}
                    alt={`${service.title} — professional roofing service by Lege Roofing`}
                    className="h-56 w-full object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="absolute bottom-4 left-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-glow transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-7">
                  <h3 className="font-display text-xl font-bold text-ink transition-colors duration-300 group-hover:text-primary">
                    {service.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{service.description}</p>
                  <Link
                    to="/contact"
                    className="mt-6 inline-flex items-center gap-2 self-start text-sm font-semibold text-primary transition-all duration-300 hover:gap-3.5"
                  >
                    Learn More
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        <Reveal direction="up" delay={0.2} className="mt-14 text-center">
          <p className="text-sm text-muted">
            Not sure what your roof needs?{' '}
            <Link
              to="/contact"
              className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:text-primary-dark"
            >
              Get a free inspection <ArrowRight className="h-4 w-4" />
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
