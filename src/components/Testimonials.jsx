import { useRef, useEffect, useCallback, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TESTIMONIALS } from '../utils/constants';

gsap.registerPlugin(ScrollTrigger);

function Rating({ value }) {
  return (
    <div className="testimonials__stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(star => (
        <ion-icon
          key={star}
          name={star <= value ? 'star' : star - 0.5 === value ? 'star-half-outline' : 'star-outline'}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const trackRef = useRef(null);
  const cardsRef = useRef([]);
  const [scrollPos, setScrollPos] = useState(0); // eslint-disable-line no-unused-vars

  const slide = useCallback((dir) => {
    if (!trackRef.current) return;
    const scrollAmount = trackRef.current.offsetWidth * 0.8;
    trackRef.current.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' } }
      );

      gsap.fromTo(cardsRef.current,
        { opacity: 0, y: 60, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const handleScroll = () => setScrollPos(el.scrollLeft);
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="section testimonials" ref={sectionRef} aria-label="Testimonials">
      <div className="container">
        <div ref={titleRef}>
          <h2 className="section__title">People Said</h2>
        </div>

        <div className="testimonials__slider">
          <button
            className="testimonials__btn testimonials__btn--prev"
            onClick={() => slide(-1)}
            aria-label="Previous testimonial"
          >
            <ion-icon name="arrow-back-outline" aria-hidden="true" />
          </button>

          <div ref={trackRef} className="testimonials__track">
            {TESTIMONIALS.map((t, i) => (
              <article
                key={t.id}
                ref={el => cardsRef.current[i] = el}
                className="testimonials__card"
              >
                <div className="testimonials__avatar">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    width={100}
                    height={100}
                    loading="lazy"
                  />
                </div>
                <h3 className="testimonials__name">{t.name}</h3>
                <Rating value={t.rating} />
                <p className="testimonials__text">{t.text}</p>
              </article>
            ))}
          </div>

          <button
            className="testimonials__btn testimonials__btn--next"
            onClick={() => slide(1)}
            aria-label="Next testimonial"
          >
            <ion-icon name="arrow-forward-outline" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
