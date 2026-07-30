import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HOW_IT_WORKS } from '../utils/constants';

gsap.registerPlugin(ScrollTrigger);

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' } }
      );

      gsap.fromTo(cardsRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.2, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' } }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section how-it-works" id="service" ref={sectionRef} aria-label="How It Works">
      <div className="container">
        <div ref={titleRef}>
          <h2 className="section__title">How It Works</h2>
          <p className="section__text">
            A great platform to buy, sell and rent your properties without any agent or commissions
          </p>
        </div>

        <div className="how-it-works__grid">
          {HOW_IT_WORKS.map((item, i) => (
            <article
              key={item.id}
              ref={el => cardsRef.current[i] = el}
              className="how-it-works__card"
            >
              <div className="how-it-works__icon">
                <ion-icon name={item.icon} aria-hidden="true" />
              </div>
              <h3 className="how-it-works__title">{item.title}</h3>
              <p className="how-it-works__text">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
