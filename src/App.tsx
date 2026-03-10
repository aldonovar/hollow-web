import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Lenis from 'lenis';

import { Layout } from './components/Layout';
import { Contact } from './pages/Contact';
import { Ecosystem } from './pages/Ecosystem';
import { Engine } from './pages/Engine';
import { Home } from './pages/Home';
import { Roadmap } from './pages/Roadmap';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function App() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
    });

    const handleLenisFrame = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(handleLenisFrame);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(handleLenisFrame);
      lenis.destroy();
    };
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="engine" element={<Engine />} />
          <Route path="ecosystem" element={<Ecosystem />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="contact" element={<Contact />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
