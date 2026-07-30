import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import HeroForm from './HeroForm';

export default function Hero() {
  const [activeTab, setActiveTab] = useState('build');
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(titleRef.current, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1 })
      .fromTo(descRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.5')
      .fromTo(formRef.current, { y: 60, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 1 }, '-=0.4');
  }, []);

  return (
    <section className="hero" id="home">
      <div className="hero__bg-overlay" />
      <div className="hero__container container">
        <div className="hero__content">
          <h1 ref={titleRef} className="hero__title">
            Ledge Roofing – Build That Remarkable Roof Today
          </h1>
          <p ref={descRef} className="hero__description">
            Get Ledge Roofing professionals to build or repair your home&apos;s roof without breaking the bank
          </p>
        </div>

        <div ref={formRef} className="hero__form-wrapper">
          <div className="hero__form-tab" role="tablist" aria-label="Service type">
            <button
              className={`hero__tab-btn${activeTab === 'build' ? ' active' : ''}`}
              onClick={() => setActiveTab('build')}
              role="tab"
              aria-selected={activeTab === 'build'}
              aria-controls="panel-build"
            >
              Build
            </button>
            <button
              className={`hero__tab-btn${activeTab === 'repair' ? ' active' : ''}`}
              onClick={() => setActiveTab('repair')}
              role="tab"
              aria-selected={activeTab === 'repair'}
              aria-controls="panel-repair"
            >
              Repair
            </button>
          </div>

          <div
            id="panel-build"
            role="tabpanel"
            hidden={activeTab !== 'build'}
          >
            {activeTab === 'build' && <HeroForm type="build" />}
          </div>
          <div
            id="panel-repair"
            role="tabpanel"
            hidden={activeTab !== 'repair'}
          >
            {activeTab === 'repair' && <HeroForm type="repair" />}
          </div>
        </div>
      </div>
    </section>
  );
}
