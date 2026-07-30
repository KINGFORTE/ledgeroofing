import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Services() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="section services-cta" id="services" ref={sectionRef} aria-label="Our Services">
      <div className="container">
        <div ref={contentRef} className="services-cta__content">
          <span className="section__subtitle">OUR SERVICES</span>
          <h2 className="section__title">High Quality Roofing Services</h2>
          <p className="services-cta__text">
            We provide stand-out roofing services to you, offering confidence and security in construction.
          </p>
          <a href="#" className="btn btn--primary">Download Policy</a>
        </div>
      </div>
    </section>
  );
}
