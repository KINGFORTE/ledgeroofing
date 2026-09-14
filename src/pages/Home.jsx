import Hero from '../components/Hero';
import About from '../components/About';
import Services from '../components/Services';
import WhyChooseUs from '../components/WhyChooseUs';
import Projects from '../components/Projects';
import Testimonials from '../components/Testimonials';
import Process from '../components/Process';
import CTA from '../components/CTA';
import Seo from '../components/Seo';

export default function Home() {
  return (
    <>
      <Seo path="/" />
      <Hero />
      <About />
      <Services />
      <WhyChooseUs />
      <Projects />
      <Testimonials />
      <Process />
      <CTA />
    </>
  );
}
