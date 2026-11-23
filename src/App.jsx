import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollProgress from './components/ScrollProgress';
import SplashScreen from './components/SplashScreen';
import Home from './pages/Home';
import { Analytics } from "@vercel/analytics/react"

const About = lazy(() => import('./pages/About'));
const Leadership = lazy(() => import('./pages/Leadership'));
const ExecutiveProfile = lazy(() => import('./pages/ExecutiveProfile'));
const Services = lazy(() => import('./pages/Services'));
const Projects = lazy(() => import('./pages/Projects'));
const Testimonials = lazy(() => import('./pages/Testimonials'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogArticle = lazy(() => import('./pages/BlogArticle'));
const ServiceAreas = lazy(() => import('./pages/ServiceAreas'));
const Socials = lazy(() => import('./pages/Socials'));
const Contact = lazy(() => import('./pages/Contact'));
const StaffPortal = lazy(() => import('./pages/StaffPortal'));
const GuestMeeting = lazy(() => import('./pages/GuestMeeting'));

function ScrollManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function PullToRefresh() {
  useEffect(() => {
    let startY = 0;
    let pulling = false;
    const threshold = 80;
    const indicator = document.createElement('div');
    indicator.setAttribute('aria-hidden', 'true');
    Object.assign(indicator.style, {
      position: 'fixed', top: '0', left: '50%', transform: 'translate(-50%, -56px)',
      width: '40px', height: '40px', borderRadius: '999px', background: '#16a34a', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '9999',
      boxShadow: '0 8px 24px rgba(22,163,74,.35)', transition: 'transform .18s ease, opacity .18s ease',
      opacity: '0', fontSize: '18px', fontWeight: '700', pointerEvents: 'none',
    });
    indicator.textContent = '↓';
    document.body.appendChild(indicator);

    const topScroll = () => window.scrollY <= 0 && !document.querySelector('[data-scroll-lock="true"]');
    const onStart = (e) => {
      if (!topScroll()) return;
      const touch = e.touches?.[0];
      if (!touch) return;
      startY = touch.clientY;
      pulling = true;
      indicator.style.opacity = '1';
      indicator.textContent = '↓';
    };
    const onMove = (e) => {
      if (!pulling) return;
      const touch = e.touches?.[0];
      if (!touch) return;
      const dy = Math.max(0, touch.clientY - startY);
      if (dy <= 0) return;
      if (dy > 10 && topScroll()) e.preventDefault();
      const offset = Math.min(72, dy * 0.35);
      indicator.style.transform = `translate(-50%, ${-56 + offset}px)`;
      indicator.textContent = dy > threshold ? '↻' : '↓';
    };
    const finish = (e) => {
      if (!pulling) return;
      pulling = false;
      const touch = e.changedTouches?.[0];
      const dy = touch ? Math.max(0, touch.clientY - startY) : 0;
      indicator.style.transform = 'translate(-50%, -56px)';
      indicator.style.opacity = '0';
      if (dy > threshold && topScroll()) window.location.reload();
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', finish, { passive: true });
    document.addEventListener('touchcancel', finish, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', finish);
      document.removeEventListener('touchcancel', finish);
      indicator.remove();
    };
  }, []);
  return null;
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Something went wrong.' };
  }
  componentDidCatch(error) {
    console.error('App error boundary:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 text-center">
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="font-display text-xl font-bold text-slate-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600">Please refresh the page. If this keeps happening, contact your workspace admin.</p>
            <p className="mt-3 break-words text-xs text-slate-400">{this.state.message}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700">Reload page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white" aria-hidden="true">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary/15 border-t-primary" />
    </div>
  );
}

export default function App() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    document.getElementById('preboot-loader')?.remove();
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes booted={booted} setBooted={setBooted} />
    </BrowserRouter>
  );
}

function AppRoutes({ booted, setBooted }) {
  const { pathname } = useLocation();
  const isStaff = pathname.startsWith('/staff');
  const isMeeting = pathname.startsWith('/meeting/');
  const hideChrome = isStaff || isMeeting;

  return (
    <>
      <ScrollManager />
      <PullToRefresh />
      {!hideChrome && <ScrollProgress />}
      {!hideChrome && <Navbar />}
      <main>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/leadership" element={<Leadership />} />
              <Route path="/leadership/:slug" element={<ExecutiveProfile />} />
              <Route path="/services" element={<Services />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogArticle />} />
              <Route path="/service-areas" element={<ServiceAreas />} />
              <Route path="/socials" element={<Socials />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/staff/*" element={<StaffPortal />} />
              <Route path="/meeting/:token" element={<GuestMeeting />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      {!hideChrome && <Footer />}
      {!hideChrome && <Analytics />}
      {!hideChrome && <AnimatePresence>{!booted && <SplashScreen onDone={() => setBooted(true)} />}</AnimatePresence>}
    </>
  );
}
