import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Reveal from './Reveal';

export default function ExecutiveCard({ executive, delay = 0 }) {
  return (
    <Reveal direction="up" delay={delay}>
      <Link
        to={`/leadership/${executive.slug}`}
        className="group block overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-float"
      >
        <div className="relative overflow-hidden">
          <img
            src={executive.image}
            alt={`${executive.name}, ${executive.role} at Ledge Roofing`}
            className="aspect-[4/5] w-full object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-110"
            loading="lazy"
          />
          <span className="absolute right-5 top-5 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow-glow transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>
        <div className="p-6">
          <h3 className="font-display text-xl font-bold text-ink transition-colors duration-300 group-hover:text-primary">
            {executive.name}
          </h3>
          <p className="mt-1 text-sm font-semibold text-primary">{executive.role}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{executive.shortBio}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all duration-300 group-hover:gap-3.5">
            View Profile <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
