import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TEAM_MEMBERS } from '../utils/constants';

gsap.registerPlugin(ScrollTrigger);

export default function Team() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const sliderRef = useRef(null);
  const cardsRef = useRef([]);
  const [scrollPos, setScrollPos] = useState(0); // eslint-disable-line no-unused-vars

  const slide = useCallback((dir) => {
    if (!sliderRef.current) return;
    const scrollAmount = sliderRef.current.offsetWidth * 0.8;
    sliderRef.current.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' } }
      );

      gsap.fromTo(cardsRef.current,
        { opacity: 0, y: 60, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.12, ease: 'back.out(1.7)',
          scrollTrigger: { trigger: sliderRef.current, start: 'top 80%' } }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const handleScroll = () => setScrollPos(el.scrollLeft);
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="section team" id="team" ref={sectionRef} aria-label="Our Team">
      <div className="container">
        <div ref={titleRef}>
          <h2 className="section__title">Meet Our Team</h2>
          <p className="section__text">
            We provide the best roofing professionals to make your project a construction masterpiece.
          </p>
        </div>

        <div className="team__slider">
          <button
            className="team__slider-btn team__slider-btn--prev"
            onClick={() => slide(-1)}
            aria-label="Previous team member"
          >
            <ion-icon name="chevron-back-outline" aria-hidden="true" />
          </button>

          <div ref={sliderRef} className="team__track" role="list">
            {TEAM_MEMBERS.map((member, i) => (
              <div
                key={member.id}
                ref={el => cardsRef.current[i] = el}
                className="team__card"
                role="listitem"
              >
                <div className="team__card-image">
                  <img
                    src={member.image}
                    alt={member.name}
                    width={400}
                    height={500}
                    loading="lazy"
                  />
                </div>
                <div className="team__card-body">
                  <h3 className="team__card-name">{member.name}</h3>
                  <p className="team__card-role">{member.role}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            className="team__slider-btn team__slider-btn--next"
            onClick={() => slide(1)}
            aria-label="Next team member"
          >
            <ion-icon name="chevron-forward-outline" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
