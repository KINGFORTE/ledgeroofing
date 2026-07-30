import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Team from './components/Team';
import HowItWorks from './components/HowItWorks';
import Services from './components/Services';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  useEffect(() => {
    ScrollTrigger.refresh();
    window.addEventListener('resize', () => ScrollTrigger.refresh());
    return () => window.removeEventListener('resize', () => ScrollTrigger.refresh());
  }, []);

  return (
    <>
      <Header />
      <main className="main">
        <Hero />
        <About />
        <Team />
        <HowItWorks />
        <Services />
        <Testimonials />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
