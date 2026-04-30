import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Lenis from 'lenis';

import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Features } from './pages/Features';
import { Pricing } from './pages/Pricing';
import { Console } from './pages/Console';
import { Roadmap } from './pages/Roadmap';
import { Contact } from './pages/Contact';
import { Auth } from './pages/Auth';
import { Engine } from './pages/Engine';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }, [pathname]);
  return null;
}

function App() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
    const onFrame = (time: number) => { lenis.raf(time * 1000); };
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(onFrame);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(onFrame); lenis.destroy(); };
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="features" element={<Features />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="console" element={<Console />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Auth type="login" />} />
          <Route path="signup" element={<Auth type="signup" />} />
        </Route>
        {/* Engine without the Layout shell because it's full screen */}
        <Route path="/engine" element={<Engine />} />
      </Routes>
    </Router>
  );
}

export default App;
