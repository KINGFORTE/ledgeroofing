import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Clock, CalendarDays, Search } from 'lucide-react';
import PageHero from '../components/PageHero';
import Reveal from '../components/Reveal';
import NewsletterSignup from '../components/NewsletterSignup';
import CTA from '../components/CTA';
import usePageTitle from '../hooks/usePageTitle';
import { BLOG_POSTS, BLOG_CATEGORIES } from '../utils/constants';

export default function Blog() {
  usePageTitle('Blog');
  const [active, setActive] = useState('All');
  const [query, setQuery] = useState('');

  const featured = BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0];
  const rest = BLOG_POSTS.filter((p) => p.id !== featured.id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rest.filter((post) => {
      const matchesCategory = active === 'All' || post.category === active;
      const matchesQuery = !q || post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [active, query, rest]);

  return (
    <>
      <PageHero
        eyebrow="Our Blog"
        title={
          <>
            Roofing Insights &amp;
            <br />
            <span className="bg-gradient-to-r from-primary-light via-red-400 to-amber-300 bg-clip-text text-transparent">
              Expert Advice.
            </span>
          </>
        }
        text="Practical guides, maintenance tips and everything you need to make smart decisions about your roof."
      />

      <section className="relative py-24 lg:py-32">
        <div className="grid-lines absolute inset-0 opacity-[0.3]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal direction="up">
            <article className="group relative overflow-hidden rounded-[2rem] shadow-float">
              <div className="relative h-[26rem] overflow-hidden lg:h-[30rem]">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10 lg:p-12">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-glow">
                    Featured
                  </span>
                  <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur">
                    {featured.tag}
                  </span>
                </div>
                <h2 className="mt-5 max-w-3xl font-display text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                  {featured.title}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">{featured.excerpt}</p>
                <div className="mt-5 flex flex-wrap items-center gap-5 text-xs font-medium text-white/70">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-red-300" /> {featured.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-red-300" /> {featured.read}
                  </span>
                </div>
              </div>
            </article>
          </Reveal>

          <div className="mt-16 flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap gap-2">
              {BLOG_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                    active === cat
                      ? 'bg-primary text-white shadow-glow'
                      : 'border border-line bg-white text-charcoal hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles…"
                aria-label="Search articles"
                className="w-full rounded-full border border-line bg-white py-3 pl-11 pr-5 text-sm text-ink placeholder:text-muted/60 transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_4px_rgb(22_163_74_/_0.1)] focus:outline-none"
              />
            </div>
          </div>

          <motion.div layout className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((post) => (
                <motion.article
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="group overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-float"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-56 w-full object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-110"
                      loading="lazy"
                    />
                    <span className="absolute left-5 top-5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-glow">
                      {post.tag}
                    </span>
                  </div>
                  <div className="p-7">
                    <div className="flex items-center gap-4 text-xs font-medium text-muted">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-red-400" /> {post.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-red-400" /> {post.read}
                      </span>
                    </div>
                    <h2 className="mt-4 font-display text-xl font-bold leading-snug text-ink transition-colors duration-300 group-hover:text-primary">
                      {post.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all duration-300 group-hover:gap-3.5">
                      Read Article <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 && (
            <Reveal direction="up" className="mt-12 text-center">
              <p className="text-sm text-muted">No articles match your search. Try a different term or category.</p>
            </Reveal>
          )}
        </div>
      </section>

      <NewsletterSignup />

      <CTA />
    </>
  );
}
