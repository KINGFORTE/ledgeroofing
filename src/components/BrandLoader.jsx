import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { COMPANY, LOGO } from '../utils/constants';

const EASE = [0.16, 1, 0.3, 1];
const MIN_VISIBLE = 2200;
const MAX_VISIBLE = 9000;
const EXIT_MS = 800;
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

    statusTimer = setTimeout(() => setStatus(ROTATING[1]), 1800);
    dismissTimer = setTimeout(() => {
      setLeaving(true);
      dismissTimer = setTimeout(onDone, EXIT_MS);
    }, Math.max(MIN_VISIBLE - (Date.now() - started), 0));

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
      animate={leaving ? { opacity: 0, scale: 1.02 } : { opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="fixed inset-0 z-[100] flex select-none items-center justify-center overflow-hidden bg-[#0d5c2c]"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {/* ── Deep green field ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, #17a34a 0%, #127c3a 28%, #0d5c2c 58%, #06381c 100%)',
        }}
      />

      {/* ── Soft light bloom behind the mark ── */}
      <div
        className="loader-halo pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[46rem] w-[46rem] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 62%)',
        }}
      />

      {/* ── Slow drifting geometry for depth ── */}
      <div
        className="loader-drift pointer-events-none absolute -left-32 top-[-18%] h-[30rem] w-[30rem] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 68%)',
        }}
      />
      <div
        className="loader-drift pointer-events-none absolute -right-40 bottom-[-22%] h-[34rem] w-[34rem] rounded-full"
        style={{
          animationDelay: '-8s',
          background:
            'radial-gradient(circle, rgba(74,222,128,0.18) 0%, rgba(74,222,128,0) 66%)',
        }}
      />

      {/* ── Edge vignette keeps the centre stage bright ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(90% 70% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.38) 100%)',
        }}
      />

      <div className="relative flex w-full max-w-sm flex-col items-center px-8 text-center">
        {/* ── Mark: white logo on a glass plate, roofline drawing over it ── */}
        <div
          className="loader-item loader-mark relative flex items-center justify-center"
          style={{ padding: 'clamp(0.9rem, 3.2vw, 1.4rem)', animationDelay: '150ms' }}
        >
          <div className="absolute inset-0 rounded-3xl border border-white/20 bg-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-md" />
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-transparent to-transparent" />
          <img
            src={LOGO}
            alt={COMPANY.name}
            className="relative h-full w-full object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
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
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p
          className="loader-item loader-brand mt-9 font-display font-bold uppercase tracking-[0.32em] text-white"
          style={{ animationDelay: '600ms', textShadow: '0 2px 24px rgba(0,0,0,0.35)' }}
        >
          {COMPANY.name}
        </p>

        <p
          className="loader-item loader-tagline mt-3 font-sans font-medium uppercase tracking-[0.3em] text-white/65"
          style={{ animationDelay: '950ms' }}
        >
          {status}
        </p>

        {/* ── Progress track ── */}
        <div
          className="loader-item loader-bar relative mt-10 overflow-hidden rounded-full bg-white/20"
          style={{ animationDelay: '1300ms' }}
        >
          <div className="loader-bar-fill h-full w-full rounded-full bg-white shadow-[0_0_16px_rgba(255,255,255,0.55)]" />
          <div className="loader-bar-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        </div>
      </div>
    </motion.div>
  );
}
