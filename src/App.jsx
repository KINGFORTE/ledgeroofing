import { lazy, Suspense, useEffect, useState } from 'react';
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
const Contact = lazy(() => import('./pages/Contact'));

function isCrawler() {
  try {
    const ua = (navigator.userAgent || '').toLowerCase();
    return /googlebot|bingbot|bingpreview|duckduckbot|baiduspider|yandex|slurp|facebookexternalhit|facebookbot|twitterbot|linkedinbot|pinterest|whatsapp|embedly|quora|telegrambot|vkShare|vkcom|ahrefs|semrush|mj12bot|dotbot|petalbot|exabot|uptimerobot|archive\.org_bot|google-inspectiontool|feedfetcher|headlesschrome|phantomjs|curl|wget|python-requests|go-http-client/i.test(
      ua
    );
  } catch {
    return true;
  }
}

function ScrollManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white" aria-hidden="true">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-red-100 border-t-primary" />
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('splash-off')) return false;
      if (params.has('splash')) sessionStorage.removeItem('ledge-splash-seen');
      if (isCrawler()) return false;
      return !sessionStorage.getItem('ledge-splash-seen');
    } catch {
      return false;
    }
  });

  const handleSplashDone = () => {
    try {
      sessionStorage.setItem('ledge-splash-seen', '1');
    } catch {}
    setShowSplash(false);
  };

  return (
    <BrowserRouter>
      <ScrollManager />
      <ScrollProgress />
      <Navbar />
      <main>
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
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <Analytics />

      <AnimatePresence>
        {showSplash && <SplashScreen onDone={handleSplashDone} />}
      </AnimatePresence>
    </BrowserRouter>
  );
}
