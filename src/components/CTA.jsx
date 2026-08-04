import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { ArrowRight, Phone, Mail, CheckCircle2, Loader2, MapPin, CalendarClock } from 'lucide-react';
import Button from './Button';
import Reveal from './Reveal';
import { COMPANY, BACKGROUNDS, SERVICES } from '../utils/constants';

const inputCls =
  'w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 text-sm text-white placeholder:text-white/45 transition-colors duration-300 focus:border-primary focus:bg-white/15 focus:outline-none';

export default function CTA() {
  const [status, setStatus] = useState('idle');
  const [form, setForm] = useState({ name: '', phone: '', email: '', service: '', message: '' });

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        { ...form, reply_to: form.email },
        { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY }
      );
      setStatus('success');
      setForm({ name: '', phone: '', email: '', service: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="relative scroll-mt-24 overflow-hidden bg-ink">
      <div className="absolute inset-0">
        <img
          src={BACKGROUNDS.ctaBanner}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-35"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/60" />
        <div className="grid-lines-dark absolute inset-0 opacity-40" />
      </div>
      <div className="absolute -right-24 top-10 h-96 w-96 rounded-full bg-primary/25 blur-[130px]" aria-hidden="true" />
      <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-amber-400/15 blur-[120px]" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-14 px-5 py-24 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-8 lg:py-32">
        <div>
          <Reveal direction="right">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              Free Estimates — No Obligation
            </span>
          </Reveal>
          <Reveal direction="right" delay={0.08}>
            <h2 className="mt-6 font-display text-4xl font-bold leading-[1.06] text-white sm:text-5xl lg:text-[3.4rem]">
              Ready To Upgrade
              <br />
              <span className="bg-gradient-to-r from-red-400 via-primary-light to-amber-300 bg-clip-text text-transparent">
                Your Roof?
              </span>
            </h2>
          </Reveal>
          <Reveal direction="right" delay={0.16}>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
              Get a free, detailed inspection and an honest quote — with premium materials and a
              workmanship warranty on every project. Let’s protect what matters most.
            </p>
          </Reveal>
          <Reveal direction="right" delay={0.24} className="mt-9 flex flex-wrap gap-4">
            <a href="#contact">
              <Button size="lg">
                Get Free Estimate
                <ArrowRight className="h-4.5 w-4.5" />
              </Button>
            </a>
            <a href={COMPANY.phoneHref}>
              <Button size="lg" variant="white">
                <Phone className="h-4 w-4" />
                Call Now
              </Button>
            </a>
          </Reveal>

          <Reveal direction="right" delay={0.32} className="mt-12 grid gap-4 sm:grid-cols-2">
            <a
              href={COMPANY.phoneHref}
              className="group flex items-center gap-4 rounded-2xl bg-white/5 p-4 transition-colors duration-300 hover:bg-white/10"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-glow">
                <Phone className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-xs text-white/50">Call us anytime</span>
                <span className="font-display text-sm font-bold text-white group-hover:text-red-300">
                  {COMPANY.phone}
                </span>
              </span>
            </a>
            <a
              href={`mailto:${COMPANY.email}`}
              className="group flex items-center gap-4 rounded-2xl bg-white/5 p-4 transition-colors duration-300 hover:bg-white/10"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
                <Mail className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-xs text-white/50">Email us</span>
                <span className="font-display text-sm font-bold text-white group-hover:text-amber-300">
                  {COMPANY.email}
                </span>
              </span>
            </a>
          </Reveal>

          <Reveal direction="right" delay={0.4} className="mt-6 flex flex-wrap items-center gap-6 text-sm text-white/60">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-400" />
              {COMPANY.address}
            </span>
            <span className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-red-400" />
              {COMPANY.hours}
            </span>
          </Reveal>
        </div>

        <Reveal direction="left" delay={0.15}>
          <div className="glass-dark relative rounded-[2rem] p-8 shadow-float sm:p-10">
            <div className="absolute -right-4 -top-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-glow animate-float">
              <CalendarClock className="h-7 w-7" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white">Request Your Free Estimate</h3>
            <p className="mt-2 text-sm text-white/60">
              Fill in the form and our team will get back to you within 24 hours.
            </p>

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 flex flex-col items-center gap-4 rounded-2xl bg-white/5 p-10 text-center"
                >
                  <CheckCircle2 className="h-14 w-14 text-green-400" />
                  <div>
                    <div className="font-display text-xl font-bold text-white">Request received!</div>
                    <p className="mt-2 text-sm text-white/60">
                      Thank you for reaching out. A roofing specialist will contact you shortly.
                    </p>
                  </div>
                  <button
                    onClick={() => setStatus('idle')}
                    className="mt-2 text-sm font-semibold text-red-300 hover:text-red-200"
                  >
                    Send another request
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="mt-7 space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      required
                      placeholder="Full name"
                      aria-label="Full name"
                      value={form.name}
                      onChange={update('name')}
                      className={inputCls}
                    />
                    <input
                      required
                      type="tel"
                      placeholder="Phone number"
                      aria-label="Phone number"
                      value={form.phone}
                      onChange={update('phone')}
                      className={inputCls}
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    aria-label="Email"
                    value={form.email}
                    onChange={update('email')}
                    className={inputCls}
                  />
                  <select
                    required
                    value={form.service}
                    onChange={update('service')}
                    aria-label="Service needed"
                    className={`${inputCls} ${form.service ? 'text-white' : 'text-white/45'}`}
                  >
                    <option value="" disabled className="text-ink">
                      What do you need help with?
                    </option>
                    {SERVICES.map((s) => (
                      <option key={s.id} value={s.title} className="text-ink">
                        {s.title}
                      </option>
                    ))}
                    <option value="Not sure yet" className="text-ink">
                      Not sure yet — need advice
                    </option>
                  </select>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your project (optional)"
                    aria-label="Project details"
                    value={form.message}
                    onChange={update('message')}
                    className={`${inputCls} resize-none`}
                  />
                  <Button type="submit" size="lg" className="w-full" disabled={status === 'sending'}>
                    {status === 'sending' ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        Send My Free Estimate
                        <ArrowRight className="h-4.5 w-4.5" />
                      </>
                    )}
                  </Button>
                  {status === 'error' && (
                    <p className="text-center text-sm font-medium text-red-300">
                      Something went wrong. Please email us at {COMPANY.email}.
                    </p>
                  )}
                  <p className="text-center text-xs text-white/40">
                    No spam, no obligations. Your details stay private.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
