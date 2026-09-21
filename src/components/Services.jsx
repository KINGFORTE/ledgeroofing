import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SectionHeading from './SectionHeading';
import Reveal from './Reveal';
import ServiceCarousel from './ServiceCarousel';

export default function Services() {
  return (
    <section id="services" className="relative scroll-mt-24 bg-mist/60 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="What We Do"
          title="Roofing Services Built To Last"
          text="From first inspection to final cleanup, every service is delivered with the same obsession over quality, safety and detail."
        />

        <ServiceCarousel />

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
