import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, Phone } from 'lucide-react';
import { NAV_LINKS, COMPANY, LOGO } from '../utils/constants';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const linkClasses = ({ isActive }) =>
    `relative py-2 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'text-primary'
        : scrolled
          ? 'text-charcoal hover:text-primary'
          : 'text-white/85 hover:text-white'
    }`;

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-black/5 bg-white/85 shadow-[0_8px_30px_rgb(26_26_26_/_0.07)] backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Lege Roofing — home">
          <img
            src={LOGO}
            alt="Lege Roofing logo"
            className="h-11 w-11 object-contain transition-transform duration-300 group-hover:-rotate-6"
          />
          <span className="flex flex-col leading-none">
            <span
              className={`font-display text-xl font-bold tracking-tight transition-colors duration-300 ${
                scrolled ? 'text-ink' : 'text-white'
              }`}
            >
              LEDGE
            </span>
            <span
              className={`text-[0.65rem] font-semibold uppercase tracking-[0.34em] transition-colors duration-300 ${
                scrolled ? 'text-primary' : 'text-red-200'
              }`}
            >
              Roofing
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-5 lg:flex xl:gap-7">
          {NAV_LINKS.map((link) => (
            <li key={link.id} className="relative">
              <NavLink to={link.href} end={link.href === '/'} className={linkClasses}>
                {({ isActive }) => (
                  <>
                    <span>{link.label}</span>
                    <motion.span
                      layoutId="nav-underline"
                      className={`absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-primary ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                      transition={{ duration: 0.3 }}
                    />
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            to="/contact"
            className="hidden items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark md:inline-flex"
          >
            Get Free Estimate
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={COMPANY.phoneHref}
            className="hidden h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-ink transition-all duration-300 hover:border-primary hover:text-primary xl:inline-flex"
            aria-label="Call Lege Roofing"
          >
            <Phone className="h-4.5 w-4.5" />
          </a>
          <button
            onClick={() => setOpen(!open)}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors lg:hidden ${
              scrolled ? 'bg-black/5 text-ink' : 'bg-white/10 text-white backdrop-blur'
            }`}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 top-[76px] z-40 bg-white/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex h-full flex-col overflow-y-auto px-6 py-8">
              <ul className="space-y-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.li
                    key={link.id}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.35 }}
                  >
                    <NavLink
                      to={link.href}
                      end={link.href === '/'}
                      className={({ isActive }) =>
                        `flex items-center justify-between border-b border-black/5 py-4 font-display text-2xl font-semibold ${
                          isActive ? 'text-primary' : 'text-ink'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {link.label}
                          <ArrowRight className={`h-5 w-5 ${isActive ? 'text-primary' : 'opacity-40'}`} />
                        </>
                      )}
                    </NavLink>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-auto space-y-4 pt-8">
                <Link
                  to="/contact"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-display text-base font-semibold text-white shadow-glow"
                >
                  Get Free Estimate
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={COMPANY.phoneHref}
                  className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-black/10 px-6 py-4 font-display text-base font-semibold text-ink"
                >
                  <Phone className="h-4 w-4" />
                  {COMPANY.phone}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
