import { useState } from 'react';
import { motion } from 'framer-motion';

const base =
  'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-display font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none';

const variants = {
  primary:
    'bg-primary text-white shadow-glow hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0',
  dark: 'bg-ink text-white hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0',
  outline:
    'border-2 border-ink/15 bg-white text-ink hover:border-primary hover:text-primary hover:-translate-y-0.5',
  white:
    'bg-white text-ink hover:bg-ink hover:text-white hover:-translate-y-0.5',
  ghost: 'text-ink hover:text-primary',
};

const sizes = {
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-[0.9375rem]',
  sm: 'px-4 py-2 text-xs',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  ...rest
}) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const id = Date.now();

    setRipples((r) => [...r, { id, x, y, size }]);
    setTimeout(() => {
      setRipples((r) => r.filter((rip) => rip.id !== id));
    }, 650);

    if (onClick) onClick(e);
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={handleClick}
      {...rest}
    >
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          className="pointer-events-none absolute rounded-full bg-white/30"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
          }}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
      {children}
    </button>
  );
}
