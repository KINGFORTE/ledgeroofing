import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];
const VIDEO_SRC = '/videos%20for%20splash/splashvid.mp4';
const LAST_SECONDS = 1;
const MAX_WAIT = 12000;

export default function SplashScreen({ onDone }) {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const exitTimer = useRef(null);

  /* ── Detect reduced-motion ── */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* ── Detect mobile / touch ── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640 || 'ontouchstart' in window);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ── Lock body scroll ── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* ── Pause the video in its final 2 seconds and reveal the welcome UI ── */
  const stopAndReady = useCallback(() => {
    const v = videoRef.current;
    if (v && !v.paused) v.pause();
    setReady(true);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    if (v.duration - v.currentTime <= LAST_SECONDS) stopAndReady();
  }, [stopAndReady]);

  /* ── Skip the video entirely when reduced motion is preferred ── */
  useEffect(() => {
    if (reducedMotion) stopAndReady();
  }, [reducedMotion, stopAndReady]);

  /* ── Fallback: never leave the user stuck if the video stalls ── */
  useEffect(() => {
    if (ready) return;
    const timeout = setTimeout(stopAndReady, MAX_WAIT);
    return () => clearTimeout(timeout);
  }, [ready, stopAndReady]);

  const handleVideoError = useCallback(() => stopAndReady(), [stopAndReady]);

  useEffect(() => () => clearTimeout(exitTimer.current), []);

  /* ── Dismiss ── */
  const handleEnter = useCallback(() => {
    if (exiting) return;
    const v = videoRef.current;
    if (v && !v.paused) v.pause();
    setExiting(true);
    exitTimer.current = setTimeout(onDone, 1600);
  }, [exiting, onDone]);

  /* ── Keyboard support ── */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleEnter();
    }
  }, [handleEnter]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="fixed inset-0 z-[100] flex select-none flex-col items-center justify-center overflow-hidden bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Ledge Roofing"
    >
      {/* ── Splash video: fades in from black at the start ── */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={exiting ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: reducedMotion ? 0.3 : 1.8, ease: EASE }}
      >
        <motion.div
          className="absolute inset-0 bg-black"
          initial={{ opacity: 1 }}
          animate={exiting || reducedMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.3 : 2.2, ease: EASE }}
        />
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          className="h-full w-full object-cover"
          style={{ filter: 'contrast(1.08) saturate(1.12) brightness(1.04)' }}
          autoPlay
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          onTimeUpdate={handleTimeUpdate}
          onEnded={stopAndReady}
          onError={handleVideoError}
        />
      </motion.div>

      {/* ── Subtle darkening so the welcome copy stays readable ── */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10"
        animate={exiting ? { opacity: 0 } : { opacity: ready ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0.3 : 1.2, ease: EASE }}
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.62) 100%)',
        }}
      />

      {/* ── Welcome caption + continue button, revealed on the paused frame ── */}
      {ready && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={exiting ? { opacity: 0, y: -30 } : { opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0.3 : 1.0, ease: EASE }}
        >
          <div className="splash-stack flex h-full flex-col items-center justify-center px-6 text-center">
            <motion.img
              src="/images/logo.png"
              alt="Ledge Roofing"
              initial={{ opacity: 0, filter: 'blur(14px)', y: 24 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ duration: reducedMotion ? 0.3 : 1.3, ease: EASE }}
              className="splash-logo w-auto max-w-[80vw] object-contain"
            />

            <motion.h1
              initial={{ opacity: 0, filter: 'blur(16px)', y: 18 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ duration: reducedMotion ? 0.3 : 1.1, delay: reducedMotion ? 0 : 0.25, ease: EASE }}
              className="splash-brand font-display font-bold uppercase tracking-[0.28em] text-white"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}
            >
              Welcome to Ledge Roofing
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, filter: 'blur(10px)', y: 12 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ duration: reducedMotion ? 0.3 : 1.0, delay: reducedMotion ? 0 : 0.55, ease: EASE }}
              className="splash-tagline max-w-xl font-sans font-medium normal-case tracking-normal text-white/85"
              style={{ textShadow: '0 2px 18px rgba(0,0,0,0.65)' }}
            >
              Home of roofing built above the ordinary — engineered to protect what
              matters most, project after project.
            </motion.p>

            <motion.button
              onClick={handleEnter}
              onKeyDown={handleKeyDown}
              initial={{ opacity: 0, y: 14 }}
              animate={exiting ? { opacity: 0, scale: 0.96, y: -8 } : { opacity: 1, y: 0 }}
              transition={{
                duration: reducedMotion ? 0.3 : 0.9,
                delay: reducedMotion ? 0 : 0.9,
                ease: EASE,
              }}
              className="splash-enter group mt-8 flex shrink-0 items-center gap-3 rounded-full border border-white/25 bg-white/10 font-display font-semibold uppercase tracking-[0.24em] text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:border-primary hover:bg-primary hover:shadow-[0_0_45px_rgba(22,163,74,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white/70 active:scale-[0.96]"
              aria-label={isMobile ? 'Enter Ledge Roofing site' : 'Continue to Ledge Roofing site'}
            >
              <span>{isMobile ? 'ENTER LEDGE' : 'CONTINUE TO SITE'}</span>
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">
                <span className="splash-arrow inline-block">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}