import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { COMPANY, LOGO } from '../utils/constants';

const EASE = [0.16, 1, 0.3, 1];
const MIN_VISIBLE = 1800;
const MAX_WAIT = 9000;
const EXIT_MS = 900;

const STATUS = [
  'Warming up the workspace',
  'Preparing your experience',
  'Securing your connection',
];

const SIGNALS = ['Loading assets', 'Typesetting brand', 'Almost there'];

export default function SplashScreen({ onDone, label = 'Loading' }) {
  const [progress, setProgress] = useState(0);
  const [signal, setSignal] = useState(0);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const startedAt = useRef(Date.now());

  const mediaReady = useCallback(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const videos = Array.from(document.querySelectorAll('video'));
    const imagesOk = imgs.every((img) => img.complete && img.naturalWidth > 0);
    const videosOk = videos.some((v) => v.readyState >= 3);
    return imagesOk && (!videos.length || videosOk);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let assetsDone = false;
    let fontsDone = false;
    let windowDone = document.readyState === 'complete';

    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    Promise.all([fontsReady, new Promise((resolve) => {
      if (windowDone) return resolve();
      window.addEventListener('load', () => {
        windowDone = true;
        resolve();
      }, { once: true });
    })]).then(() => {
      if (!cancelled) fontsDone = true;
    });

    const poll = setInterval(() => {
      if (cancelled || assetsDone) return;
      if (mediaReady()) assetsDone = true;
    }, 140);

    const tick = setInterval(() => {
      if (cancelled) return;
      const elapsed = Date.now() - startedAt.current;
      const target = windowDone && fontsDone && assetsDone ? 100 : 92;
      setProgress((p) => {
        const ceiling = Math.min(target, Math.max(8, (elapsed / MIN_VISIBLE) * 100));
        return p + (ceiling - p) * 0.12 + 0.4;
      });

      if (windowDone && fontsDone && assetsDone && elapsed > MIN_VISIBLE) {
        setReady(true);
      } else if (elapsed > MAX_WAIT) {
        setReady(true);
      }
    }, 90);

    const rotator = setInterval(() => {
      setSignal((s) => (s + 1) % SIGNALS.length);
    }, 1600);

    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(tick);
      clearInterval(rotator);
    };
  }, [mediaReady]);

  useEffect(() => {
    if (!ready) return undefined;
    const t = setTimeout(() => setProgress(100), 60);
    return () => clearTimeout(t);
  }, [ready]);

  const enter = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onDone, EXIT_MS);
  }, [leaving, onDone]);

  useEffect(() => {
    if (!ready) return undefined;
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        enter();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, enter]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const pct = Math.min(100, Math.round(progress));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed inset-0 z-[110] flex select-none items-center justify-center overflow-hidden bg-white"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {/* ── Green wash + soft blooms ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 8%, #ecfdf5 0%, #f0fdf4 32%, #ffffff 68%, #f7fff9 100%)',
        }}
      />
      <div
        className="splash-halo pointer-events-none absolute left-1/2 top-[38%] h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(22,163,74,0.13) 0%, rgba(22,163,74,0) 64%)',
        }}
      />
      <div
        className="splash-badge pointer-events-none absolute -left-24 bottom-[-14%] h-[24rem] w-[24rem] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(74,222,128,0.22) 0%, rgba(74,222,128,0) 66%)',
        }}
      />
      <div
        className="splash-badge pointer-events-none absolute -right-28 top-[-16%] h-[26rem] w-[26rem] rounded-full"
        style={{
          animationDelay: '-4s',
          background:
            'radial-gradient(circle, rgba(22,163,74,0.14) 0%, rgba(22,163,74,0) 68%)',
        }}
      />

      {/* ── Blueprint grid ── */}
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(85% 65% at 50% 45%, rgba(255,255,255,0) 40%, rgba(6,56,28,0.07) 100%)',
        }}
        aria-hidden="true"
      />

      {/* ── Rotating dashed roof ring behind the mark ── */}
      <svg
        className="splash-orbit pointer-events-none absolute left-1/2 top-1/2 h-[19rem] w-[19rem] -translate-x-1/2 -translate-y-1/2 text-primary/25 sm:h-[23rem] sm:w-[23rem]"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="100"
          cy="100"
          r="88"
          stroke="currentColor"
          strokeWidth="1"
          className="splash-dash"
        />
        <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      </svg>

      <div className="relative flex w-full max-w-md flex-col items-center px-8 text-center">
        {/* ── Logo plate ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: EASE }}
          className="relative"
        >
          <div className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl" aria-hidden="true" />
          <div className="relative flex items-center justify-center rounded-[1.75rem] border border-primary/15 bg-white p-4 shadow-[0_24px_60px_-18px_rgba(21,128,61,0.35)]">
            <div
              className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-primary/10 via-transparent to-transparent"
              aria-hidden="true"
            />
            <img
              src={LOGO}
              alt={COMPANY.name}
              width={104}
              height={104}
              className="splash-logo relative object-contain"
            />
          </div>
          <span
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-glow"
            aria-hidden="true"
          >
            <ShieldCheck className="h-4 w-4" />
          </span>
        </motion.div>

        {/* ── Wordmark ── */}
        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          className="splash-wordmark mt-8 font-display font-bold uppercase tracking-[0.3em] text-ink"
        >
          {COMPANY.name}
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
          className="mt-4 h-px w-16 origin-center bg-gradient-to-r from-transparent via-primary to-transparent"
          aria-hidden="true"
        />

        {/* ── Caption ── */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.34, ease: EASE }}
          className="splash-caption mt-4 max-w-xs font-sans font-semibold uppercase leading-relaxed tracking-[0.28em] text-primary/75"
        >
          {COMPANY.tagline}
        </motion.p>

        {/* ── Loader ── */}
        <div className="mt-10 flex w-full flex-col items-center">
          <div
            className="splash-bar relative overflow-hidden rounded-full bg-primary/12"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <div
              className="splash-bar-fill h-full rounded-full bg-gradient-to-r from-primary-light via-primary to-primary-dark shadow-[0_0_14px_rgba(22,163,74,0.55)]"
              style={{ width: `${pct}%` }}
            />
            {!ready && (
              <div className="splash-sweep pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            )}
          </div>

          <div className="mt-5 flex w-full items-center justify-center gap-4">
            <span className="h-1 w-1 rounded-full bg-primary/40" aria-hidden="true" />
            <motion.span
              key={signal}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="splash-caption font-sans font-medium uppercase tracking-[0.24em] text-muted"
            >
              {ready ? 'Site ready' : STATUS[signal]}
            </motion.span>
            <span className="h-1 w-1 rounded-full bg-primary/40" aria-hidden="true" />
          </div>

          <span className="mt-2 font-display text-xs font-semibold tabular-nums tracking-[0.2em] text-primary/50">
            {String(pct).padStart(3, '0')}%
          </span>
        </div>

        {/* ── Enter ── */}
        <div className="mt-9 flex h-16 items-center justify-center">
          <motion.button
            type="button"
            onClick={enter}
            disabled={!ready}
            aria-label="Enter Ledge Roofing"
            initial={false}
            animate={
              ready
                ? { opacity: 1, y: 0, scale: 1, pointerEvents: 'auto' }
                : { opacity: 0, y: 18, scale: 0.94, pointerEvents: 'none' }
            }
            whileHover={ready ? { scale: 1.04 } : undefined}
            whileTap={ready ? { scale: 0.97 } : undefined}
            transition={{ duration: 0.7, ease: EASE }}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-primary px-9 py-4 font-display text-sm font-bold uppercase tracking-[0.2em] text-white shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none"
          >
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              aria-hidden="true"
            />
            <span className="relative">Enter Site</span>
            <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </motion.button>
        </div>
      </div>

      {/* ── Corner meta ── */}
      <div className="splash-item pointer-events-none absolute inset-x-0 bottom-6 px-6 text-center" style={{ animationDelay: '1s' }}>
        <p className="splash-caption font-sans font-medium uppercase tracking-[0.3em] text-ink/30">
          Lagos, Nigeria &middot; Est. {COMPANY.founded}
        </p>
      </div>
    </motion.div>
  );
}