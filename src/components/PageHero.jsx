import Reveal from './Reveal';

export default function PageHero({ eyebrow, title, text, children, align = 'left' }) {
  const center = align === 'center';

  return (
    <section className="relative overflow-hidden bg-ink pb-20 pt-40">
      <div className="grid-lines-dark absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/25 blur-[130px]" aria-hidden="true" />
      <div className="absolute -left-24 -top-16 h-80 w-80 rounded-full bg-amber-400/10 blur-[120px]" aria-hidden="true" />
      <div className={`relative z-10 mx-auto max-w-7xl px-5 lg:px-8 ${center ? 'text-center' : ''}`}>
        <Reveal direction="up">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {eyebrow}
          </span>
        </Reveal>
        <Reveal direction="up" delay={0.1}>
          <h1
            className={`mt-6 font-display text-4xl font-bold leading-[1.06] text-white sm:text-5xl lg:text-[3.6rem] ${
              center ? 'mx-auto max-w-4xl' : 'max-w-3xl'
            }`}
          >
            {title}
          </h1>
        </Reveal>
        {text && (
          <Reveal direction="up" delay={0.18}>
            <p
              className={`mt-5 text-lg leading-relaxed text-white/70 ${
                center ? 'mx-auto max-w-2xl' : 'max-w-xl'
              }`}
            >
              {text}
            </p>
          </Reveal>
        )}
        {children && <Reveal direction="up" delay={0.26}>{children}</Reveal>}
      </div>
    </section>
  );
}
