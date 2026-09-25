import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { COMPANY, LOGO } from '../utils/constants';

const EASE = [0.22, 1, 0.36, 1];
const MIN_VISIBLE = 500;
const MAX_VISIBLE = 2600;
const ROTATING = [
  'Preparing your experience',
  'Securing your connection',
  'Almost there',
];

export default function BrandLoader({ onDone, label = 'Loading' }) {
  const [leaving, setLeaving] = useState(false);
  const [status, setStatus] = useState(ROTATING[0]);

  useEffect(() => {
    if (!onDone) return undefined;

    let statusTimer;
    let dismissTimer;
    const started = Date.now();
    const elapsed = () => Date.now() - started;

    statusTimer = setTimeout(() => setStatus(ROTATING[1]), 900);
    dismissTimer = setTimeout(() => {
      setLeaving(true);
      dismissTimer = setTimeout(onDone, 550);
    }, Math.max(MIN_VISIBLE - elapsed(), 0));

    const failsafe = setTimeout(() => {
      setLeaving(true);
      onDone();
    }, MAX_VISIBLE);

    return () => {
      clearTimeout(statusTimer);
      clearTimeout(dismissTimer);
      clearTimeout(failsafe);
    };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={leaving ? { opacity: 0 } : { opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="fixed inset-0 z-[100] flex select-none items-center justify-center overflow-hidden bg-white"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {/* ── Ambient wash: keeps the screen from reading as a flat white page ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 45% at 50% 42%, rgba(22,163,74,0.07) 0%, rgba(255,255,255,0) 70%), linear-gradient(180deg, #ffffff 0%, #f4f5f7 100%)',
        }}
      />
      <div
        className="loader-halo pointer-events-none absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(22,163,74,0.09) 0%, rgba(22,163,74,0) 65%)',
        }}
      />

      <div className="relative flex w-full max-w-sm flex-col items-center px-8 text-center">
        {/* ── Mark: logo inside a soft plate, roofline drawing over it ── */}
        <div
          className="loader-item loader-mark relative flex items-center justify-center"
          style={{ padding: 'clamp(0.85rem, 3vw, 1.3rem)', animationDelay: '60ms' }}
        >
          <div className="loader-plate absolute inset-0 rounded-2xl border border-line bg-white/85 shadow-card backdrop-blur-sm" />
          <img
            src={LOGO}
            alt={COMPANY.name}
            className="relative h-full w-full object-contain"
          />
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className="loader-roofline"
              d="M8 56 L50 18 L92 56"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p
          className="loader-item loader-brand mt-7 font-display font-bold uppercase tracking-[0.32em] text-ink"
          style={{ animationDelay: '180ms' }}
        >
          {COMPANY.name}
        </p>

        <p
          className="loader-item loader-tagline mt-2 font-sans font-semibold uppercase tracking-[0.28em] text-primary"
          style={{ animationDelay: '260ms' }}
        >
          {status}
        </p>

        {/* ── Progress track ── */}
        <div
          className="loader-item loader-bar mt-8 overflow-hidden rounded-full bg-line"
          style={{ animationDelay: '340ms' }}
        >
          <div className="loader-bar-fill h-full w-full rounded-full bg-primary" />
        </div>
      </div>
    </motion.div>
  );
}
