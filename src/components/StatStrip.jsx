import Reveal from './Reveal';
import AnimatedCounter from './AnimatedCounter';

export default function StatStrip({ stats, dark = true, columns = 'lg:grid-cols-4' }) {
  return (
    <section className={`relative ${dark ? 'bg-ink' : 'bg-mist/60'}`}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className={`grid grid-cols-2 gap-y-10 py-14 text-center ${columns}`}>
          {stats.map((stat, i) => (
            <Reveal key={stat.label + stat.note} delay={i * 0.08} className="relative">
              <div className={`font-display text-4xl font-bold sm:text-5xl ${dark ? 'text-white' : 'text-primary'}`}>
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <div
                className={`mt-2 text-sm font-semibold uppercase tracking-wider ${
                  dark ? 'text-red-300' : 'text-ink'
                }`}
              >
                {stat.label}
              </div>
              {stat.note && (
                <div className={`mt-1 text-xs ${dark ? 'text-white/50' : 'text-muted'}`}>{stat.note}</div>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
