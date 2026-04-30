import { useEffect, useState } from 'react';
import { Menu, X, User } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AnimatedBackground } from '../AnimatedBackground';
import { routeMeta } from '../content';

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  return (
    <div className="site-shell">
      <AnimatedBackground />
      <div className="site-shell__noise" aria-hidden="true" />

      <header className={`site-nav ${scrolled ? 'site-nav--scrolled' : ''}`}>
        <div className="site-nav__inner">
          <Link className="brand-lockup" to="/">
            <img src="/logo-sphere.svg" alt="HOLLOW bits" className="brand-lockup__icon" />
            <div className="brand-lockup__text">
              <span className="brand-lockup__hollow">HOLLOW</span>
              <span className="brand-lockup__bits">bits</span>
            </div>
          </Link>

          <button
            type="button"
            className="site-nav__toggle"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className={`site-nav__panel ${menuOpen ? 'site-nav__panel--open' : ''}`}>
            <nav className="site-nav__links">
              {routeMeta.map(item => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`site-nav__link ${item.path === location.pathname ? 'is-active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="site-nav__auth">
              <Link className="site-nav__login" to="/login">Log In</Link>
              <Link className="site-nav__cta" to="/signup">
                Sign Up
                <User className="site-nav__icon" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="site-main">
        <div className="site-main__frame" key={location.pathname}>
          <Outlet />
        </div>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <Link className="brand-lockup brand-lockup--footer" to="/">
              <img src="/logo-sphere.svg" alt="HOLLOW bits" className="brand-lockup__icon" />
              <div className="brand-lockup__text">
                <span className="brand-lockup__hollow">HOLLOW</span>
                <span className="brand-lockup__bits">bits</span>
              </div>
            </Link>
            <p>El DAW que fusiona rendimiento nativo, colaboración en tiempo real y una estética sin precedentes.</p>
          </div>
          <div className="site-footer__col">
            <h4>Producto</h4>
            <Link to="/features">Features</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/console">Console</Link>
            <Link to="/roadmap">Roadmap</Link>
          </div>
          <div className="site-footer__col">
            <h4>Recursos</h4>
            <a href="https://github.com/aldonovar/hollow-bits" target="_blank" rel="noopener noreferrer">GitHub</a>
            <Link to="/contact">Soporte</Link>
          </div>
          <div className="site-footer__col">
            <h4>Legal</h4>
            <Link to="/contact">Términos</Link>
            <Link to="/contact">Privacidad</Link>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} HOLLOW BITS — ALLYX</span>
          <span>Desktop-first. Web-ready.</span>
        </div>
      </footer>
    </div>
  );
}
