import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const imageRef = useRef(null);
  const itemsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(imageRef.current,
        { opacity: 0, x: -80, scale: 0.95 },
        { opacity: 1, x: 0, scale: 1, duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' } }
      );

      gsap.fromTo(contentRef.current,
        { opacity: 0, x: 80 },
        { opacity: 1, x: 0, duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' } }
      );

      gsap.fromTo(itemsRef.current,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out',
          scrollTrigger: { trigger: contentRef.current, start: 'top 75%' } }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const items = [
    'Professional workers',
    'Guaranteed quality',
    'Extensive experience',
    'We quote your project',
  ];

  return (
    <section className="section about" id="about" ref={sectionRef} aria-label="About Us">
      <div className="container about__grid">
        <div ref={imageRef} className="about__banner">
          <div className="about__image-wrapper">
            <img
              src="images/abt-banner.jpg"
              alt="Roofing project showcase"
              width={600}
              height={700}
              loading="lazy"
              className="about__image"
            />
            <button className="about__play-btn" aria-label="Play video">
              <ion-icon name="play" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div ref={contentRef} className="about__content">
          <span className="section__subtitle">ABOUT US</span>
          <h2 className="section__title">We Provide The Best Roofing Services</h2>
          <p className="about__text">
            We provide the best roofing professionals to make your project a construction masterpiece, something unique and unmatched.
          </p>

          <ul className="about__list">
            {items.map((item, i) => (
              <li
                key={item}
                ref={el => itemsRef.current[i] = el}
                className="about__list-item"
              >
                <ion-icon name="checkmark-circle" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <a href="#projects" className="btn btn--primary">View Projects</a>
        </div>
      </div>
    </section>
  );
}
