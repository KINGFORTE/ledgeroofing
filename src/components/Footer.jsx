import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SOCIAL_LINKS } from '../utils/constants';

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 90%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <footer className="footer" id="contact" ref={sectionRef}>
      <div className="footer__top">
        <div className="container footer__grid">
          <div className="footer__brand">
            <a href="#" className="footer__logo">
              <ion-icon name="business-outline" aria-hidden="true" />
              <span>Ledge Roofing</span>
            </a>
            <p className="footer__tagline">
              Write To Us &amp; Build
            </p>
          </div>

          <div className="footer__col">
            <h3 className="footer__title">CONTACT ME</h3>
            <ul className="footer__list">
              <li className="footer__item">
                <ion-icon name="location-outline" aria-hidden="true" />
                <address>
                  Lagos - Nigeria<br />
                  221 Ikorodu road
                </address>
              </li>
              <li className="footer__item">
                <ion-icon name="mail-outline" aria-hidden="true" />
                <a href="mailto:info@ledgeroofing.com" className="footer__link">info@ledgeroofing.com</a>
              </li>
            </ul>
          </div>

          <div className="footer__col">
            <h3 className="footer__title">Social</h3>
            <ul className="footer__social">
              {SOCIAL_LINKS.map(link => (
                <li key={link.name}>
                  <a
                    href={link.url}
                    className="footer__social-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.name}
                  >
                    <ion-icon name={link.icon} aria-hidden="true" />
                    <span>{link.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container">
          <p className="footer__copy">&copy; {new Date().getFullYear()} Ledge Roofing. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
