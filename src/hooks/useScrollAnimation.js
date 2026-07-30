import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useScrollAnimation(ref, options = {}) {
  const animationRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const {
      from = {},
      to = {},
      scrollTrigger = {},
    } = options;

    animationRef.current = gsap.fromTo(
      el,
      { opacity: 0, y: 60, ...from },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
          ...scrollTrigger,
        },
        ...to,
      }
    );

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
      ScrollTrigger.getAll().forEach(st => st.refresh());
    };
  }, [ref, options]);
}
