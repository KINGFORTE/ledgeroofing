import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import alfredImg from '../../project media for web - Copy/Alfred Court Project/images/IMG_3824.JPEG';
import greenParkImg from '../../project media for web - Copy/Green Park/images/IMG_7850.JPEG';
import nigerDockImg from '../../project media for web - Copy/Niger Dock Factory_/images/IMG_6811.JPEG';
import alausaImg from '../../project media for web - Copy/Alausa heights_/images/IMG_5477.JPEG';
import nauticaImg from '../../project media for web - Copy/Nautica Beach/images/IMG_5189.JPEG';

const EASE = [0.22, 1, 0.36, 1];

const signatureUnderline = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.1, delay: 0.75, ease: 'easeInOut' },
  },
};

const comments = [
  {
    name: 'Chidi E.',
    text: 'Absolutely perfect roof installation. Professional from start to finish!',
    stars: 5,
    avatar: alfredImg,
    pos: 'left-[4%] top-[10%] sm:left-[6%] sm:top-[14%]',
    delay: 0.9,
    dir: { x: -42, y: 20 },
    bob: 0.3,
  },
  {
    name: 'Blessing O.',
    text: 'They transformed our home. The attention to detail is insane.',
    stars: 5,
    avatar: greenParkImg,
    pos: 'right-[2%] top-[16%] sm:right-[7%] sm:top-[18%]',
    delay: 1.2,
    dir: { x: 42, y: -16 },
    bob: 0.7,
  },
  {
    name: 'Tunde A.',
    text: 'Best roofing team in Lagos. Highly recommend Ledge!',
    stars: 5,
    avatar: nigerDockImg,
    pos: 'left-[2%] bottom-[14%] sm:left-[8%] sm:bottom-[18%]',
    delay: 1.5,
    dir: { x: -38, y: 24 },
    bob: 0.5,
  },
  {
    name: 'Ngozi I.',
    text: 'Fast, clean, and the roof looks incredible. Five stars.',
    stars: 5,
    avatar: alausaImg,
    pos: 'right-[4%] bottom-[16%] sm:right-[9%] sm:bottom-[20%]',
    delay: 1.8,
    dir: { x: 40, y: 20 },
    bob: 0.9,
  },
  {
    name: 'Emeka U.',
    text: 'From estimate to finish — seamless. Absolutely love it.',
    stars: 5,
    avatar: nauticaImg,
    pos: 'left-[6%] top-[44%] sm:left-[10%] sm:top-[48%]',
    delay: 2.1,
    dir: { x: -44, y: -12 },
    bob: 0.1,
  },
];

function CommentBubble({ name, text, stars, avatar, pos, delay, dir, bob }) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(12px)', scale: 0.88, x: dir.x, y: dir.y }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1, x: 0, y: 0 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={`absolute z-10 flex max-w-[220px] items-start gap-2.5 rounded-2xl border border-white/15 bg-black/45 px-3 py-2.5 backdrop-blur-md shadow-float sm:max-w-[250px] sm:px-3.5 sm:py-3 ${pos}`}
      style={{ animation: `float ${6 + bob * 4}s ease-in-out infinite`, animationDelay: `${delay}s` }}
    >
      <img
        src={avatar}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white/20 sm:h-9 sm:w-9"
      />
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[0.7rem] font-bold text-white sm:text-xs">{name}</span>
          <span className="flex gap-0.5">
            {Array.from({ length: stars }).map((_, i) => (
              <Star key={i} className="h-2 w-2 fill-amber-400 text-amber-400 sm:h-2.5 sm:w-2.5" />
            ))}
          </span>
        </div>
        <p className="mt-1 text-[0.62rem] leading-snug text-white/85 sm:text-[0.68rem]">{text}</p>
      </div>
    </motion.div>
  );
}

export default function SplashScreen({ onDone }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = window.setTimeout(onDone, 3800);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previous;
    };
  }, [onDone]);

  return (
    <motion.div
      onClick={onDone}
      onPointerDown={onDone}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(16px)', scale: 1.06 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="fixed inset-0 z-[100] flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          'radial-gradient(120% 90% at 15% 10%, rgba(74,222,128,0.35) 0%, rgba(74,222,128,0) 45%), radial-gradient(120% 100% at 85% 90%, rgba(22,163,74,0.5) 0%, rgba(22,163,74,0) 55%), #15803d',
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.35) 1.5px, transparent 1.5px)',
          backgroundSize: '26px 26px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: 18 }}
        animate={{ opacity: 0.2, scale: 1, rotate: 12 }}
        transition={{ duration: 1.4, delay: 0.2, ease: EASE }}
        className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-[2.5rem] bg-[#4ade80]/40"
        style={{ mixBlendMode: 'screen' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: -16 }}
        animate={{ opacity: 0.18, scale: 1, rotate: -10 }}
        transition={{ duration: 1.4, delay: 0.4, ease: EASE }}
        className="absolute bottom-[-12%] right-[-8%] h-80 w-80 rounded-[3rem] bg-[#22c55e]/40"
        style={{ mixBlendMode: 'screen' }}
      />

      {comments.map((c) => (
        <CommentBubble key={c.name} {...c} />
      ))}

      <div className="relative z-20 flex flex-col items-center justify-center px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, filter: 'blur(14px)', scale: 0.86, y: 22 }}
          animate={{ opacity: 1, filter: 'blur(0px)', scale: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.18, ease: EASE }}
          className="font-signature italic text-[clamp(6rem,20vw,12rem)] leading-none tracking-tight text-white"
          style={{ transform: 'rotate(-7deg)', textShadow: '0 6px 28px rgba(0,0,0,0.35)' }}
        >
          Ledge
        </motion.h1>

        <svg
          viewBox="0 0 420 70"
          className="mt-[-0.5rem] w-[min(78vw,26rem)] overflow-visible"
          fill="none"
          aria-hidden="true"
        >
          <motion.path
            d="M16,52 C56,38 86,60 130,50 C174,40 206,58 250,48 C294,38 326,54 372,44"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            variants={signatureUnderline}
            initial="hidden"
            animate="show"
          />
          <motion.path
            d="M372,44 C380,40 392,50 382,42 C376,37 370,46 366,42"
            stroke="#fcd34d"
            strokeWidth="3.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.8, ease: 'easeInOut' }}
          />
        </svg>

        <motion.p
          initial={{ opacity: 0, filter: 'blur(8px)', y: 14 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 0.8, delay: 1.25, ease: EASE }}
          className="mt-6 font-display text-xs font-semibold uppercase tracking-[0.42em] text-white/70 sm:text-sm"
        >
          Premium Roofing
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 2.1, ease: EASE }}
          className="mt-10 flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 backdrop-blur-sm"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inset-0 rounded-full bg-white/60 animate-pulse-ring" />
            <span className="relative rounded-full bg-white" />
          </span>
          <span className="font-display text-sm font-semibold text-white/90">Tap anywhere to enter</span>
          <ArrowRight className="h-4 w-4 text-white/70" />
        </motion.div>
      </div>
    </motion.div>
  );
}