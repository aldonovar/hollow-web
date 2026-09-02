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
import { AuthCallback } from './pages/AuthCallback';
import { Settings } from './pages/Settings';
import { MfaChallenge } from './pages/MfaChallenge';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { DesktopAuthBridge } from './pages/DesktopAuthBridge';
import { OAuthConsent } from './pages/OAuthConsent';
import { readAuthNextFromSearch } from './lib/authFlow';
import { useAuthStore } from './stores/authStore';
import { toDawfiSurfaceUrl } from '@hollowbits/core';

const DawApp = lazy(() => import('./daw/App'));

type DawProductMode = 'studio' | 'score' | 'keys';

const PRODUCT_ROUTE_META: Record<DawProductMode, { title: string; loadingLabel: string }> = {
  studio: { title: 'DAW-fi Studio', loadingLabel: 'CARGANDO DAW-FI STUDIO...' },
  score: { title: 'Score-fi | DAW-fi', loadingLabel: 'CARGANDO SCORE-FI...' },
  keys: { title: 'Keys-fi | DAW-fi', loadingLabel: 'CARGANDO KEYS-FI...' },
};

function DawProductRoute({ mode }: { mode: DawProductMode }) {
  const meta = PRODUCT_ROUTE_META[mode];

  useEffect(() => {
    const previousTitle = document.title;
    document.title = meta.title;
    return () => { document.title = previousTitle; };
  }, [meta.title]);

  return (
    <Suspense fallback={<div className="daw-product-loading" role="status" aria-live="polite">{meta.loadingLabel}</div>}>
      <DawApp surfaceMode={mode} />
    </Suspense>
  );
}

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
  const { search } = useLocation();
  const nextPath = readAuthNextFromSearch(search);

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

  if (session) return <Navigate to={nextPath} replace />;
  return <>{children}</>;
}

const isPlayApp = window.location.hostname.startsWith('play.') || window.location.hostname.startsWith('console.');
const CANONICAL_STUDIO_REDIRECT_HOSTS = new Set(['hollowbits.com', 'www.hollowbits.com']);

/**
 * A Supabase browser session is origin scoped.  Keeping login, console and
 * product tools on `play.` prevents a successful login on `www.` from looking
 * like a different account on the DAW surface.  Local development deliberately
 * keeps the embedded routes so one Vite host remains useful offline.
 */
function CanonicalStudioRedirect({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const shouldRedirect = CANONICAL_STUDIO_REDIRECT_HOSTS.has(window.location.hostname.toLowerCase());

  useEffect(() => {
    if (!shouldRedirect) return;
    const path = `${location.pathname}${location.search}${location.hash}`;
    window.location.replace(toDawfiSurfaceUrl('studio', path));
  }, [location.hash, location.pathname, location.search, shouldRedirect]);

  if (!shouldRedirect) return <>{children}</>;

  return (
    <main className="page-shell" aria-live="polite" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <p>Abriendo DAW-fi Studio…</p>
    </main>
  );
}

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
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/auth/callback" element={<CanonicalStudioRedirect><AuthCallback /></CanonicalStudioRedirect>} />
        <Route path="/oauth/consent" element={<OAuthConsent />} />
        <Route path="/desktop-auth" element={<DesktopAuthBridge />} />
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
              element={<DawProductRoute mode="studio" />}
            />
            <Route path="/score" element={<DawProductRoute mode="score" />} />
            <Route path="/keys" element={<DawProductRoute mode="keys" />} />
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
              <Route path="terms" element={<Terms />} />
              <Route path="login" element={<CanonicalStudioRedirect><GuestRoute><Auth type="login" /></GuestRoute></CanonicalStudioRedirect>} />
              <Route path="signup" element={<CanonicalStudioRedirect><GuestRoute><Auth type="signup" /></GuestRoute></CanonicalStudioRedirect>} />
              
              {/* Se mantienen estas rutas temporalmente para entorno de desarrollo local si no usan play.localhost */}
              <Route
                path="console"
                element={
                <CanonicalStudioRedirect><ProtectedRoute><Console /></ProtectedRoute></CanonicalStudioRedirect>
                }
              />
              <Route
                path="settings"
                element={
                <CanonicalStudioRedirect><ProtectedRoute><Settings /></ProtectedRoute></CanonicalStudioRedirect>
                }
              />
            </Route>
            
            <Route
              path="/engine"
              element={<CanonicalStudioRedirect><DawProductRoute mode="studio" /></CanonicalStudioRedirect>}
            />
            <Route path="/score" element={<CanonicalStudioRedirect><DawProductRoute mode="score" /></CanonicalStudioRedirect>} />
            <Route path="/keys" element={<CanonicalStudioRedirect><DawProductRoute mode="keys" /></CanonicalStudioRedirect>} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
