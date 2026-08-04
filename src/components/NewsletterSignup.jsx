import { useState } from 'react';
import { Mail, Send, CheckCircle2 } from 'lucide-react';
import Reveal from './Reveal';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) setDone(true);
  };

  return (
    <section className="relative overflow-hidden bg-ink py-20 lg:py-24">
      <div className="grid-lines-dark absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="absolute right-[-10%] top-0 h-72 w-72 rounded-full bg-primary/20 blur-[120px]" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center lg:px-8">
        <Reveal direction="up">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            The Roof Smart Newsletter
          </span>
        </Reveal>
        <Reveal direction="up" delay={0.1}>
          <h2 className="mt-6 font-display text-3xl font-bold leading-[1.1] text-white sm:text-4xl">
            Roofing Wisdom, Straight To Your Inbox
          </h2>
        </Reveal>
        <Reveal direction="up" delay={0.18}>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/70">
            Seasonal maintenance advice, storm alerts and exclusive offers. No spam — just smart roofing,
            delivered monthly.
          </p>
        </Reveal>
        <Reveal direction="up" delay={0.26}>
          {done ? (
            <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-3 rounded-full bg-white/5 px-6 py-4 text-sm font-medium text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              You’re subscribed — welcome aboard!
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mx-auto mt-8 flex w-full max-w-md items-center gap-3"
            >
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  aria-label="Email for newsletter"
                  className="w-full rounded-full border border-white/15 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 transition-colors focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                aria-label="Subscribe to newsletter"
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
