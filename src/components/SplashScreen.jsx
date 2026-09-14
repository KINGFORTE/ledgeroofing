import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

/* ── 3D cloud: layered radial-gradient spheres for a soft, volumetric look ── */

function Cloud3D({ id, className, style, opacity = 0.12, blur = 8 }) {
  const gid = `ledge-cloud-${id}`;
  const spheres = [
    { cx: 24, cy: 70, rx: 44, ry: 28 },
    { cx: 54, cy: 46, rx: 38, ry: 32 },
    { cx: 82, cy: 64, rx: 42, ry: 28 },
    { cx: 108, cy: 38, rx: 40, ry: 34 },
    { cx: 136, cy: 56, rx: 38, ry: 30 },
    { cx: 160, cy: 72, rx: 42, ry: 26 },
    { cx: 54, cy: 80, rx: 62, ry: 26 },
    { cx: 120, cy: 74, rx: 52, ry: 28 },
  ];
  return (
    <svg viewBox="0 0 200 116" fill="none" className={className} style={style}>
      <defs>
        <radialGradient id={gid} cx="36%" cy="26%" r="74%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="36%" stopColor="#eef4f6" stopOpacity="0.72" />
          <stop offset="66%" stopColor="#cddce3" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#96afb9" stopOpacity="0.2" />
        </radialGradient>
      </defs>
      <g opacity={opacity} filter={`blur(${blur}px)`}>
        {spheres.map((s, i) => (
          <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={`url(#${gid})`} />
        ))}
      </g>
    </svg>
  );
}

/* ── Cloud layer configuration ── */

const CLOUDS = [
  // Back layer – large, faint, slow drift
  { id: 'b1', left: '-8%',  top: '14%', w: '40%', blur: 26, opacity: 0.07,  drift: 95, bob: 13, parallax: 22, exitX: -320, exitY: -160 },
  { id: 'b2', left: '48%',  top: '62%', w: '44%', blur: 30, opacity: 0.06,  drift: 85, bob: 15, parallax: 22, exitX: 340, exitY: -130 },
  { id: 'b3', left: '18%',  top: '78%', w: '36%', blur: 24, opacity: 0.05,  drift: 105, bob: 12, parallax: 22, exitX: 260, exitY: -200 },

  // Mid layer
  { id: 'm1', left: '-6%',  top: '32%', w: '34%', blur: 20, opacity: 0.11,  drift: 68, bob: 11, parallax: 40, exitX: -300, exitY: -110 },
  { id: 'm2', left: '42%',  top: '10%', w: '38%', blur: 22, opacity: 0.09,  drift: 58, bob: 10, parallax: 40, exitX: 350, exitY: -150 },
  { id: 'm3', left: '62%',  top: '70%', w: '30%', blur: 18, opacity: 0.09,  drift: 62, bob: 12, parallax: 40, exitX: 300, exitY: -170 },

  // Front layer – smaller, sharper, faster
  { id: 'f1', left: '6%',   top: '6%',  w: '26%', blur: 14, opacity: 0.13,  drift: 48, bob: 9, parallax: 70, exitX: -270, exitY: -90 },
  { id: 'f2', left: '52%',  top: '80%', w: '32%', blur: 16, opacity: 0.11,  drift: 42, bob: 10, parallax: 70, exitX: 320, exitY: -130 },
  { id: 'f3', left: '-12%', top: '58%', w: '28%', blur: 13, opacity: 0.12,  drift: 52, bob: 8, parallax: 70, exitX: -220, exitY: -110 },
  { id: 'f4', left: '72%',  top: '22%', w: '24%', blur: 15, opacity: 0.1,   drift: 44, bob: 9, parallax: 70, exitX: 280, exitY: -100 },
];

/* ── Floating light motes – subtle drifting dust in the sky ── */

const MOTES = [
  { left: '8%', size: 3, dur: 9, delay: 0, op: 0.35 },
  { left: '16%', size: 2, dur: 12, delay: 3, op: 0.25 },
  { left: '27%', size: 4, dur: 10, delay: 1.5, op: 0.3 },
  { left: '38%', size: 2, dur: 13, delay: 5, op: 0.2 },
  { left: '52%', size: 3, dur: 11, delay: 2, op: 0.28 },
  { left: '63%', size: 2, dur: 14, delay: 6, op: 0.22 },
  { left: '74%', size: 4, dur: 12, delay: 4, op: 0.26 },
  { left: '86%', size: 3, dur: 10, delay: 7, op: 0.3 },
  { left: '94%', size: 2, dur: 13, delay: 8, op: 0.2 },
];

/* ── Splash component ── */

export default function SplashScreen({ onDone }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
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

  /* ── Mouse parallax ── */
  const handleMouseMove = useCallback((e) => {
    if (reducedMotion) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMouse({
      x: (clientX / innerWidth - 0.5) * 2,
      y: (clientY / innerHeight - 0.5) * 2,
    });
  }, [reducedMotion]);

  /* ── Dismiss ── */
  const handleEnter = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    exitTimer.current = setTimeout(onDone, 1600);
  }, [exiting, onDone]);

  useEffect(() => () => clearTimeout(exitTimer.current), []);

  /* ── Keyboard support ── */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleEnter();
    }
  }, [handleEnter]);

  const animDur = reducedMotion ? 0.3 : undefined;
  const cloudTrans = (extra) => ({
    duration: animDur ?? (1.2 + (extra || 0)),
    ease: EASE,
  });

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="fixed inset-0 z-[100] flex select-none flex-col items-center justify-center overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Ledge Roofing"
    >
      {/* ── Dark green sky background ── */}
      <motion.div
        className="absolute inset-0"
        animate={exiting ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: reducedMotion ? 0.4 : 1.2, ease: EASE }}
        style={{
          background:
            'linear-gradient(180deg, #071309 0%, #0a1f14 38%, #103020 66%, #0a1e13 100%)',
        }}
      />

      {/* ── Subtle sunlight glow behind clouds (slowly breathing) ── */}
      <motion.div
        className="absolute pointer-events-none"
        animate={exiting ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: reducedMotion ? 0.4 : 1.0, ease: EASE }}
      >
        <div
          className="splash-glow absolute"
          style={{
            width: '55vw',
            height: '55vh',
            top: '8%',
            left: '22%',
            background:
              'radial-gradient(ellipse at center, rgba(255,250,238,0.06) 0%, rgba(255,250,238,0) 68%)',
            filter: 'blur(70px)',
            animation: reducedMotion ? 'none' : 'glowPulse 9s ease-in-out infinite',
          }}
        />
      </motion.div>

      {/* ── Floating light motes ── */}
      {!reducedMotion &&
        MOTES.map((m, i) => (
          <div
            key={`mote-${i}`}
            className="splash-mote absolute pointer-events-none"
            style={{
              left: m.left,
              bottom: '-24px',
              width: m.size,
              height: m.size,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
              boxShadow: '0 0 8px 2px rgba(255,255,255,0.14)',
              '--mote-op': m.op,
              animation: `moteFloat ${m.dur}s linear ${m.delay}s infinite`,
            }}
          />
        ))}

      {/* ── Cloud layers ── */}
      <motion.div
        className="splash-cloudfield absolute inset-0"
        initial={{ opacity: 0 }}
        animate={exiting ? { opacity: 0 } : { opacity: 1 }}
        transition={
          exiting
            ? { duration: reducedMotion ? 0.3 : 1.2, ease: EASE }
            : { duration: reducedMotion ? 0.3 : 2.0, delay: reducedMotion ? 0 : 0.8, ease: EASE }
        }
      >
        {CLOUDS.map((cloud, i) => {
          const pX = reducedMotion ? 0 : mouse.x * cloud.parallax;
          const pY = reducedMotion ? 0 : mouse.y * cloud.parallax * 0.6;

          return (
            <motion.div
              key={cloud.id}
              className="absolute pointer-events-none"
              animate={
                exiting
                  ? { x: cloud.exitX, y: cloud.exitY, opacity: 0 }
                  : { x: pX, y: pY }
              }
              transition={cloudTrans()}
              style={{
                left: cloud.left,
                top: cloud.top,
                width: cloud.w,
              }}
            >
              <div
                style={{
                  animation: reducedMotion
                    ? 'none'
                    : `cloudDrift ${cloud.drift}s ease-in-out infinite alternate`,
                  animationDelay: `${i * -5}s`,
                }}
              >
                <div
                  style={{
                    animation: reducedMotion
                      ? 'none'
                      : `cloudBob ${cloud.bob}s ease-in-out infinite`,
                    animationDelay: `${i * -4}s`,
                  }}
                >
                  <Cloud3D
                    id={cloud.id}
                    className="w-full h-auto"
                    opacity={cloud.opacity}
                    blur={cloud.blur}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Center content ── */}
      <motion.div
        className="absolute inset-0 z-20 flex items-center justify-center"
        animate={exiting ? { opacity: 0, y: -30 } : { opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0.3 : 0.7, ease: EASE }}
      >
        <div
          className="splash-stack flex h-full flex-col items-center justify-center px-6 text-center"
          style={{ animation: reducedMotion ? 'none' : 'contentFloat 9s ease-in-out infinite' }}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, filter: 'blur(14px)', y: 24 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: reducedMotion ? 0.3 : 1.6, delay: reducedMotion ? 0.1 : 0.5, ease: EASE }}
            className="flex justify-center"
          >
            <img
              src="/images/logo.png"
              alt="Ledge Roofing"
              className="splash-logo w-auto max-w-[80vw] object-contain"
            />
          </motion.div>

          {/* Company name */}
          <motion.h1
            initial={{ opacity: 0, filter: 'blur(16px)', y: 18 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: reducedMotion ? 0.3 : 1.4, delay: reducedMotion ? 0.2 : 1.1, ease: EASE }}
            className="splash-brand font-display font-bold uppercase tracking-[0.28em] text-white"
            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}
          >
            Ledge Roofing
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, filter: 'blur(10px)', y: 12 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: reducedMotion ? 0.3 : 1.2, delay: reducedMotion ? 0.3 : 1.9, ease: EASE }}
            className="splash-tagline font-display font-semibold uppercase tracking-[0.45em] text-white/45"
          >
            Built Above. Built to Last.
          </motion.p>

          {/* ── TAP TO CONTINUE button ── */}
          <motion.button
            onClick={handleEnter}
            onKeyDown={handleKeyDown}
            autoFocus
            initial={{ opacity: 0, y: 14 }}
            animate={exiting ? { opacity: 0, scale: 0.96, y: -8 } : { opacity: 1, y: 0 }}
            transition={{
              duration: reducedMotion ? 0.3 : 1.0,
              delay: reducedMotion ? 0.4 : 2.8,
              ease: EASE,
            }}
            className="splash-enter group flex shrink-0 items-center gap-3 rounded border border-white/12 bg-white/[0.04] font-display font-semibold uppercase tracking-[0.28em] text-white/70 backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:border-white/28 hover:bg-white/[0.09] hover:text-white hover:shadow-[0_0_35px_rgba(255,255,255,0.06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white/70 active:scale-[0.96]"
            aria-label={isMobile ? 'Enter Ledge Roofing site' : 'Tap to continue to Ledge Roofing site'}
          >
            <span>{isMobile ? 'ENTER LEDGE' : 'TAP TO CONTINUE'}</span>
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">
              <span className="splash-arrow inline-block">
                <ArrowRight className="splash-arrow-icon h-4 w-4" />
              </span>
            </span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
