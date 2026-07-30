import { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const INITIAL_STATE = { name: '', email: '', whatsapp: '', subject: '', message: '' };

export default function HeroForm({ type }) {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const formRef = useRef(null);
  const submitting = useRef(false);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Invalid email';
    if (!formData.whatsapp.trim()) errs.whatsapp = 'WhatsApp number is required';
    if (!formData.subject.trim()) errs.subject = 'Subject is required';
    if (!formData.message.trim()) errs.message = 'Message is required';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current) return;

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    submitting.current = true;
    setStatus('sending');

    try {
      await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, PUBLIC_KEY);
      setStatus('success');
      setFormData(INITIAL_STATE);
      setTimeout(() => setStatus('idle'), 5000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    } finally {
      submitting.current = false;
    }
  };

  const fields = [
    { name: 'name', label: 'Name', type: 'text', placeholder: 'Your Name', icon: 'person-outline' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'Your Email', icon: 'mail-outline' },
    { name: 'whatsapp', label: 'WhatsApp Number', type: 'tel', placeholder: 'Your WhatsApp', icon: 'logo-whatsapp' },
    { name: 'subject', label: 'Subject', type: 'text', placeholder: 'Subject', icon: 'document-text-outline' },
  ];

  if (type === 'repair') {
    fields.splice(1, 0, {
      name: 'search',
      label: 'Search: *',
      type: 'search',
      placeholder: 'Search your home',
      icon: 'search-outline',
    });
  }

  return (
    <form ref={formRef} className="hero-form" onSubmit={handleSubmit} noValidate>
      {fields.map(f => (
        <div key={f.name} className="hero-form__field">
          <label htmlFor={`${type}-${f.name}`} className="hero-form__label">{f.label}</label>
          <div className="hero-form__input-wrapper">
            <input
              type={f.type}
              name={f.name}
              id={`${type}-${f.name}`}
              placeholder={f.placeholder}
              className="hero-form__input"
              value={formData[f.name]}
              onChange={handleChange}
              aria-invalid={!!errors[f.name]}
              aria-describedby={errors[f.name] ? `${f.name}-error` : undefined}
            />
            <ion-icon name={f.icon} aria-hidden="true" />
          </div>
          {errors[f.name] && <span id={`${f.name}-error`} className="hero-form__error">{errors[f.name]}</span>}
        </div>
      ))}

      <div className="hero-form__field">
        <label htmlFor={`${type}-message`} className="hero-form__label">Message</label>
        <div className="hero-form__input-wrapper">
          <textarea
            name="message"
            id={`${type}-message`}
            placeholder={type === 'build' ? 'Describe your project' : 'Describe issues'}
            className="hero-form__input hero-form__textarea"
            value={formData.message}
            onChange={handleChange}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
          />
          <ion-icon name="chatbox-ellipses-outline" aria-hidden="true" />
        </div>
        {errors.message && <span id="message-error" className="hero-form__error">{errors.message}</span>}
      </div>

      <button
        type="submit"
        className="btn btn--primary hero-form__btn"
        disabled={status === 'sending'}
      >
        {status === 'sending' ? (
          <><span className="spinner" aria-hidden="true" /> Sending...</>
        ) : (
          type === 'build' ? 'Send' : 'Search Now'
        )}
      </button>

      {status === 'success' && (
        <div className="hero-form__msg hero-form__msg--success" role="alert">
          Message sent successfully! We&apos;ll get back to you soon.
        </div>
      )}
      {status === 'error' && (
        <div className="hero-form__msg hero-form__msg--error" role="alert">
          Something went wrong. Please try again or email us directly.
        </div>
      )}
    </form>
  );
}
