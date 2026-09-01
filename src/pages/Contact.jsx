import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendInquiry } from '../utils/sendInquiry';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Send,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import PageHero from '../components/PageHero';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import FAQItem from '../components/FAQItem';
import Button from '../components/Button';
import DrawingUpload from '../components/DrawingUpload';
import usePageTitle from '../hooks/usePageTitle';
import { COMPANY, SERVICES, CONTACT_FAQS, SERVICE_AREAS } from '../utils/constants';

const inputCls =
  'w-full rounded-xl border border-line bg-white px-4 py-3.5 text-sm text-ink placeholder:text-muted/60 transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_4px_rgb(22_163_74_/_0.1)] focus:outline-none';

const infoCards = [
  { Icon: Phone, title: 'WhatsApp Us', value: COMPANY.phone, href: COMPANY.phoneHref },
  { Icon: Mail, title: 'Email Us', value: COMPANY.email, href: `mailto:${COMPANY.email}` },
  { Icon: MapPin, title: 'Visit Us', value: COMPANY.address },
  { Icon: Clock, title: 'Business Hours', value: COMPANY.hours },
];

export default function Contact() {
  usePageTitle('Contact Us');
  const [status, setStatus] = useState('idle');
  const [form, setForm] = useState({ name: '', phone: '', email: '', service: '', message: '' });
  const [files, setFiles] = useState([]);
  const [drawingsConfirmed, setDrawingsConfirmed] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await sendInquiry({
        ...form,
        files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      });
      setStatus('success');
      setForm({ name: '', phone: '', email: '', service: '', message: '' });
      setFiles([]);
      setDrawingsConfirmed(false);
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Contact Us"
        title={
          <>
            Let’s Talk About
            <br />
            <span className="text-red-400">Your Roof.</span>
          </>
        }
        text="Questions, estimates or an emergency — our team is ready to help. Reach out any way you like."
      >
        <a
          href={COMPANY.phoneHref}
          className="inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 font-semibold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark"
        >
          <Zap className="h-4.5 w-4.5" /> 24/7 Emergency: {COMPANY.phone}
        </a>
      </PageHero>

      <section className="relative overflow-hidden bg-white py-24 lg:py-32">
        <div className="grid-lines absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="absolute right-[-8%] top-20 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {infoCards.map((card, i) => (
              <Reveal key={card.title} delay={i * 0.08}>
                <a
                  href={card.href}
                  className="group flex h-full flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-float"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-glow">
                    <card.Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted">{card.title}</div>
                    <div className="mt-1.5 font-display text-base font-bold text-ink">{card.value}</div>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>

          <Reveal direction="up" delay={0.15} className="mt-14">
            <div className="grid gap-10 rounded-[2rem] border border-line bg-mist/60 p-8 shadow-card lg:grid-cols-[0.8fr_1.2fr] lg:p-12">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h2 className="mt-6 font-display text-2xl font-bold text-ink">Send Us A Message</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Tell us about your project and we’ll get back to you with a free estimate within 24 hours.
                  For emergencies, call us directly — our 24/7 line is always open.
                </p>
                <ul className="mt-8 space-y-3 text-sm text-muted">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary" /> Free, no-obligation inspections
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary" /> Transparent, competitive pricing
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary" /> Licensed &amp; fully insured crews
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl bg-white p-7 shadow-card sm:p-9">
                <AnimatePresence mode="wait">
                  {status === 'success' ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex h-full flex-col items-center justify-center gap-4 py-14 text-center"
                    >
                      <CheckCircle2 className="h-16 w-16 text-green-500" />
                      <div className="font-display text-2xl font-bold text-ink">Request Received ✓</div>
                      <p className="max-w-sm text-sm text-muted">
                        Thanks! We&apos;ve received your estimate request{files.length > 0 ? ' and drawings' : ''}. Our team will review your project and get back to you within 24 hours.
                      </p>
                      {files.length > 0 && (
                        <p className="max-w-sm text-xs text-muted/70">
                          Please also send your drawings via WhatsApp at{' '}
                          <a href={COMPANY.phoneHref} className="font-semibold text-primary hover:underline">
                            {COMPANY.phone}
                          </a>{' '}
                          or email them to{' '}
                          <a href={`mailto:${COMPANY.email}`} className="font-semibold text-primary hover:underline">
                            {COMPANY.email}
                          </a>{' '}
                          for our team to review.
                        </p>
                      )}
                      <p className="text-xs text-muted/50">No spam, no obligations. Your details stay private.</p>
                      <button
                        onClick={() => setStatus('idle')}
                        className="mt-2 text-sm font-semibold text-primary hover:text-primary-dark"
                      >
                        Send another message
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="space-y-5"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <input required placeholder="Full name" aria-label="Full name" value={form.name} onChange={update('name')} className={inputCls} />
                        <input required type="tel" placeholder="Phone number" aria-label="Phone number" value={form.phone} onChange={update('phone')} className={inputCls} />
                      </div>
                      <input type="email" placeholder="Email address" aria-label="Email address" value={form.email} onChange={update('email')} className={inputCls} />

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-ink">What do you need help with?</label>
                        <select required value={form.service} onChange={update('service')} aria-label="Service needed" className={inputCls}>
                          <option value="" disabled>
                            Select a service
                          </option>
                          {SERVICES.map((s) => (
                            <option key={s.id} value={s.title}>
                              {s.title}
                            </option>
                          ))}
                          <option value="Other">Other / General inquiry</option>
                        </select>
                      </div>

                      <div>
                        <div className="mb-1.5">
                          <span className="text-sm font-semibold text-ink">Attach Your Drawings</span>
                          <p className="mt-0.5 text-xs text-muted">
                            Have your architectural or roofing drawings? Attach them and we&apos;ll review them to prepare your estimate.
                          </p>
                        </div>
                        <DrawingUpload files={files} onFilesChange={setFiles} />
                        {files.length > 0 && (
                          <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-muted">
                            <input
                              type="checkbox"
                              checked={drawingsConfirmed}
                              onChange={(e) => setDrawingsConfirmed(e.target.checked)}
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-primary accent-primary"
                            />
                            I confirm these drawings are for the project I&apos;m requesting an estimate for.
                          </label>
                        )}
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-ink">Tell us about your project</label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Describe your project, timeline, any specific requirements..."
                          aria-label="Project description"
                          value={form.message}
                          onChange={update('message')}
                          className={`${inputCls} resize-none`}
                        />
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={status === 'sending'}>
                        {status === 'sending' ? (
                          <>
                            <Loader2 className="h-4.5 w-4.5 animate-spin" /> Sending…
                          </>
                        ) : (
                          <>
                            Send My Free Estimate <Send className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                      <p className="text-center text-xs text-muted/60">
                        No spam, no obligations. Your details stay private.
                      </p>
                      {status === 'error' && (
                        <p className="text-center text-sm font-medium text-red-500">
                          Something went wrong. Please email {COMPANY.email} instead.
                        </p>
                      )}
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative bg-mist/60 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <Reveal direction="right">
              <div className="h-full rounded-[2rem] border border-line bg-white p-9 shadow-card">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
                  <MapPin className="h-7 w-7" />
                </span>
                <h2 className="mt-6 font-display text-2xl font-bold text-ink">Areas We Serve</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Based in Ilupeju, Lagos, we proudly serve 10 communities across the region — with local crews in
                  every neighborhood.
                </p>
                <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                  {SERVICE_AREAS.map((area) => (
                    <li key={area} className="flex items-center gap-2.5 text-sm font-medium text-charcoal">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {area}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-primary">
                  <ShieldCheck className="h-5 w-5 shrink-0" /> Not sure if we cover you? Call and ask — the answer
                  is almost always yes.
                </div>
              </div>
            </Reveal>

            <Reveal direction="left">
              <div className="relative h-full min-h-96 overflow-hidden rounded-[2rem] border border-line bg-ink shadow-card">
                <iframe
                  title="Map showing 221 Ikorodu Road, Ilupeju, Lagos, Nigeria"
                  src="https://www.google.com/maps?q=221%20Ikorodu%20Road%2C%20Ilupeju%2C%20Lagos%2C%20Nigeria&output=embed"
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="absolute inset-0 bg-ink/55" aria-hidden="true" />
                <div className="grid-lines-dark absolute inset-0 z-10 opacity-30" aria-hidden="true" />
                <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-glow animate-float">
                    <MapPin className="h-9 w-9" />
                  </span>
                  <h3 className="mt-6 font-display text-2xl font-bold text-white">{COMPANY.address}</h3>
                  <p className="mt-2 text-sm text-white/60">Serving Ilupeju, Lagos, and the surrounding area</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors duration-300 hover:bg-primary"
                  >
                    Get Directions <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative py-24 lg:py-32">
        <div className="grid-lines absolute inset-0 opacity-[0.3]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-4xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            text="Quick answers to the questions we get asked most — before you even reach out."
          />
          <div className="mt-14 space-y-4">
            {CONTACT_FAQS.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
