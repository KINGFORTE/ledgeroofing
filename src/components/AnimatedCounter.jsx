import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function AnimatedCounter({ end, suffix = '', duration = 2 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(el,
        { textContent: 0 },
        {
          textContent: end,
          duration,
          ease: 'power2.out',
          snap: { textContent: 1 },
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [end, duration]);

  return (
    <strong ref={ref} aria-label={`${end}${suffix}`}>
      0
    </strong>
  );
}
