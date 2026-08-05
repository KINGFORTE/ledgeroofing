import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { PROJECTS } from '../utils/constants';
import { staggerContainer, fadeUp } from '../utils/motion';

const spans = [
  'lg:col-span-2 lg:row-span-2',
  '',
  '',
  '',
  'lg:col-span-2',
];

export default function Projects() {
  return (
    <section id="projects" className="relative scroll-mt-24 bg-mist/60 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            align="left"
            eyebrow="Featured Projects"
            title="Roofs We're Proud Of"
            text="Every project tells a story of craftsmanship. Explore a few recent roofs we’ve designed, built and restored."
            className="max-w-2xl"
          />
          <p className="hidden max-w-xs text-sm text-muted lg:block">
            Scroll through our portfolio of residential and commercial roofing projects across the region.
          </p>
        </div>

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="mt-14 grid auto-rows-[240px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {PROJECTS.map((project, i) => (
            <motion.article
              key={project.id}
              variants={fadeUp}
              className={`group relative cursor-pointer overflow-hidden rounded-[1.75rem] shadow-card transition-shadow duration-500 hover:shadow-float ${spans[i]}`}
            >
              <Link to="/contact" className="absolute inset-0 z-10" aria-label={`${project.title} — get a free estimate`} />
              <img
                src={project.image}
                alt={`${project.title} — ${project.category} project by Ledge Roofing`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.3s] ease-out group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent opacity-90 transition-opacity duration-500" />

              <span className="glass-dark absolute left-5 top-5 rounded-full px-4 py-1.5 text-xs font-semibold text-white">
                {project.category}
              </span>

              <span className="absolute right-5 top-5 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow-glow transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <ArrowUpRight className="h-5 w-5" />
              </span>

              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="flex items-center gap-1.5 text-xs font-medium text-white/60">
                  <MapPin className="h-3.5 w-3.5 text-red-400" />
                  {project.meta}
                </p>
                <h3 className="mt-2 font-display text-xl font-bold text-white transition-colors duration-300 group-hover:text-red-300">
                  {project.title}
                </h3>
                <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-300 opacity-0 transition-all duration-500 group-hover:opacity-100">
                  View Project
                  <span className="h-px w-8 bg-current transition-all duration-500 group-hover:w-12" />
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
