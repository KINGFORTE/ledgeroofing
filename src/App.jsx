import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollProgress from './components/ScrollProgress';
import BrandLoader from './components/BrandLoader';
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
            <Route path="/socials" element={<Socials />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <Analytics />

      <AnimatePresence>
        {!booted && <BrandLoader onDone={() => setBooted(true)} />}
      </AnimatePresence>
    </BrowserRouter>
  );
}
