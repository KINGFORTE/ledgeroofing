import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { SERVICES } from '../utils/constants';
import { ICONS } from '../utils/icons';

function ServiceCard({ service }) {
  const Icon = ICONS[service.icon];
  return (
    <Link
      to="/contact"
      className="group relative flex w-[19rem] shrink-0 flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-float sm:w-[21rem]"
    >
      <div className="relative overflow-hidden">
        <img
          src={service.image}
          alt={service.title}
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
        <span className="mt-6 inline-flex items-center gap-2 self-start text-sm font-semibold text-primary transition-all duration-300 group-hover:gap-3.5">
          Learn More
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </span>
      </div>
    </Link>
  );
}

export default function ServiceCarousel() {
  const cards = [...SERVICES, ...SERVICES];

  return (
    <div className="relative mt-16">
      <div className="group/carousel relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-mist/60 to-transparent lg:w-32" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-mist/60 to-transparent lg:w-32" aria-hidden="true" />

        <div className="flex w-max animate-marquee gap-7 px-2 py-2 group-hover/carousel:[animation-play-state:paused]">
          {cards.map((service, i) => (
            <ServiceCard key={`${service.id}-${i}`} service={service} />
          ))}
        </div>
      </div>
    </div>
  );
}