import { useEffect, lazy, Suspense } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Lenis from 'lenis';

import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Features } from './pages/Features';
import { Pricing } from './pages/Pricing';
import { Console } from './pages/Console';
import { Roadmap } from './pages/Roadmap';
import { Contact } from './pages/Contact';
import { Auth } from './pages/Auth';
import { Settings } from './pages/Settings';
import { MfaChallenge } from './pages/MfaChallenge';
import { Privacy } from './pages/Privacy';
import { useAuthStore } from './stores/authStore';

const DawApp = lazy(() => import('./daw/App'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }, [pathname]);
  return null;
}

/**
 * Redirects authenticated users away from login/signup pages.
 * If a session already exists, send them straight to /console.
 */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);

  // While loading, show a minimal centered spinner instead of blank page
  if (isLoading) {
    return (
      <div
        className="page-shell"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: 'var(--text-2)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem',
        }}
      >
        Verificando sesión...
      </div>
    );
  }

  if (session) return <Navigate to="/console" replace />;
  return <>{children}</>;
}

const isPlayApp = window.location.hostname.startsWith('play.') || window.location.hostname.startsWith('console.');

function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const requiresMfa = useAuthStore((s) => s.requiresMfa);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    // Initialize the auth store — hydrate session & subscribe to changes
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
    const onFrame = (time: number) => { lenis.raf(time * 1000); };
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(onFrame);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(onFrame); lenis.destroy(); };
  }, []);

  // Intercepción Global para 2FA
  if (requiresMfa && !isLoading) {
    return <MfaChallenge />;
  }

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {isPlayApp ? (
          /* =========================================
             RUTAS DE LA APLICACIÓN DAW (play. / console.)
             ========================================= */
          <>
            {/* Si entran a la raíz de play.hollowbits.com, van directo a la consola */}
            <Route path="/" element={<Navigate to="/console" replace />} />
            <Route path="/login" element={<GuestRoute><Auth type="login" /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><Auth type="signup" /></GuestRoute>} />
            
            <Route
              path="/console"
              element={
                <ProtectedRoute>
                  <Console />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/engine"
              element={
                <Suspense fallback={<div style={{ background:'#06080a', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'monospace', fontSize:'13px' }}>CARGANDO MOTOR AUDIO...</div>}>
                  <DawApp />
                </Suspense>
              }
            />
            <Route path="*" element={<Navigate to="/console" replace />} />
          </>
        ) : (
          /* =========================================
             RUTAS DE MARKETING (hollowbits.com)
             ========================================= */
          <>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="features" element={<Features />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="contact" element={<Contact />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="login" element={<GuestRoute><Auth type="login" /></GuestRoute>} />
              <Route path="signup" element={<GuestRoute><Auth type="signup" /></GuestRoute>} />
              
              {/* Se mantienen estas rutas temporalmente para entorno de desarrollo local si no usan play.localhost */}
              <Route
                path="console"
                element={
                  <ProtectedRoute>
                    <Console />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>
            
            <Route
              path="/engine"
              element={
                <Suspense fallback={<div style={{ background:'#06080a', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'monospace', fontSize:'13px' }}>CARGANDO MOTOR AUDIO...</div>}>
                  <DawApp />
                </Suspense>
              }
            />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
