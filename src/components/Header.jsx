import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { NAV_LINKS } from '../utils/constants';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const linksRef = useRef([]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen && menuRef.current) {
      gsap.fromTo(menuRef.current,
        { x: '100%', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
      gsap.fromTo(linksRef.current,
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power3.out', delay: 0.15 }
      );
    }
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      ref={headerRef}
      className={`header${isScrolled ? ' scrolled' : ''}`}
      data-header
    >
      <nav className="nav container">
        <a href="#" className="nav__logo" aria-label="Ledge Roofing Home">
          <ion-icon name="home-outline" aria-hidden="true" />
          <span>Ledge Roofing</span>
        </a>

        <div
          ref={menuRef}
          className={`nav__menu${isMenuOpen ? ' show-menu' : ''}`}
          id="nav-menu"
          role="navigation"
          aria-label="Main navigation"
        >
          <ul className="nav__list">
            {NAV_LINKS.map((link, i) => (
              <li key={link.href} className="nav__item">
                <a
                  ref={el => linksRef.current[i] = el}
                  href={link.href}
                  className="nav__link"
                  onClick={closeMenu}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <button
            className="nav__close"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <ion-icon name="close-outline" aria-hidden="true" />
          </button>
        </div>

        <button
          className="nav__toggle"
          onClick={() => setIsMenuOpen(prev => !prev)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
        >
          <ion-icon name={isMenuOpen ? 'close-outline' : 'menu-outline'} aria-hidden="true" />
        </button>
      </nav>
    </header>
  );
}
