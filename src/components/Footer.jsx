import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { COMPANY, NAV_LINKS, FOOTER_SERVICES, LOGO } from '../utils/constants';

const quickLinks = NAV_LINKS.map((l) => ({ label: l.label, href: l.href }));

function BrandIcon({ path, label, viewBox = '0 0 448 512' }) {
  return (
    <svg viewBox={viewBox} className="h-4 w-4 fill-current" role="img" aria-label={label}>
      <path d={path} />
    </svg>
  );
}

const SOCIALS = [
  {
    label: 'Facebook',
    href: COMPANY.social.facebook,
    path: 'M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z',
  },
  {
    label: 'Instagram',
    href: COMPANY.social.instagram,
    path: 'M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z',
  },
  {
    label: 'X (Twitter)',
    href: COMPANY.social.twitter,
    path: 'M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z',
  },
  {
    label: 'LinkedIn',
    href: COMPANY.social.linkedin,
    path: 'M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z',
  },
];

export default function Footer() {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) setSubscribed(true);
  };

  return (
    <footer className="relative overflow-hidden bg-ink text-white/60">
      <div className="grid-lines-dark absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/15 blur-[120px]" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:gap-10 lg:py-20">
          <div>
            <Link to="/" className="flex items-center gap-2.5" aria-label="Ledge Roofing — back to top">
              <img
                src={LOGO}
                alt="Ledge Roofing logo"
                className="h-12 w-12 object-contain"
              />
              <span className="flex flex-col leading-none">
                <span className="font-display text-xl font-bold tracking-tight text-white">LEDGE</span>
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.34em] text-red-400">
                  Roofing
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed">
              {COMPANY.tagline} Premium roofing craftsmanship, durable materials and honest service since
              2013.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map(({ label, href, path }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Ledge Roofing on ${label}`}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-all duration-300 hover:-translate-y-1 hover:bg-primary hover:text-white hover:shadow-glow"
                >
                  <BrandIcon path={path} label={label} />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Quick links">
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white">Quick Links</h3>
            <ul className="mt-6 space-y-3.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="group inline-flex items-center gap-2 text-sm transition-colors duration-200 hover:text-white"
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-red-400 transition-transform duration-300 group-hover:translate-x-1" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Services">
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white">Services</h3>
            <ul className="mt-6 space-y-3.5">
              {FOOTER_SERVICES.map((service) => (
                <li key={service}>
                  <Link
                    to="/services"
                    className="group inline-flex items-center gap-2 text-sm transition-colors duration-200 hover:text-white"
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-red-400 transition-transform duration-300 group-hover:translate-x-1" />
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white">Get In Touch</h3>
            <ul className="mt-6 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-400" />
                {COMPANY.address}
              </li>
              <li>
                <a
                  href={COMPANY.phoneHref}
                  className="flex items-center gap-3 transition-colors duration-200 hover:text-white"
                >
                  <Phone className="h-4.5 w-4.5 shrink-0 text-red-400" />
                  {COMPANY.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="flex items-center gap-3 transition-colors duration-200 hover:text-white"
                >
                  <Mail className="h-4.5 w-4.5 shrink-0 text-red-400" />
                  {COMPANY.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-400" />
                <span>
                  {COMPANY.hours}
                  <br />
                  {COMPANY.hoursSunday}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-white">Get roofing tips in your inbox</h3>
              <p className="mt-1.5 text-sm text-white/50">
                Seasonal maintenance advice, storm alerts and exclusive offers. No spam.
              </p>
            </div>
            {subscribed ? (
              <div className="flex items-center gap-3 rounded-full bg-white/5 px-6 py-4 text-sm font-medium text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                You’re subscribed — welcome aboard!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex w-full max-w-md items-center gap-3">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    aria-label="Email for newsletter"
                    className="w-full rounded-full border border-white/15 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 transition-colors focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  aria-label="Subscribe to newsletter"
                  className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-7 text-xs text-white/40 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </p>
          <p>
            Licensed &amp; Insured • <span className="text-white/60">Workmanship warranty on every project</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
