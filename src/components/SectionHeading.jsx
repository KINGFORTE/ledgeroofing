import Reveal from './Reveal';

export default function SectionHeading({
  eyebrow,
  title,
  text,
  align = 'center',
  dark = false,
  className = '',
}) {
  const alignCls = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <div className={`max-w-2xl ${alignCls} ${className}`}>
      <Reveal direction="up">
        <span
          className={`mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.18em] ${
            dark ? 'bg-white/10 text-red-300' : 'bg-red-50 text-primary'
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {eyebrow}
        </span>
      </Reveal>
      <Reveal direction="up" delay={0.08}>
        <h2
          className={`text-balance font-display text-3xl font-bold leading-[1.1] sm:text-4xl lg:text-[2.75rem] ${
            dark ? 'text-white' : 'text-ink'
          }`}
        >
          {title}
        </h2>
      </Reveal>
      {text && (
        <Reveal direction="up" delay={0.16}>
          <p
            className={`mt-5 text-base leading-relaxed sm:text-lg ${
              dark ? 'text-white/70' : 'text-muted'
            }`}
          >
            {text}
          </p>
        </Reveal>
      )}
    </div>
  );
}
