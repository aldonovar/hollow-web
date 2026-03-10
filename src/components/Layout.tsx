import { useEffect, useMemo, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { AnimatedBackground } from '../AnimatedBackground';
import { routeMeta } from '../content';

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const activeRoute = useMemo(() => {
    const match = routeMeta.find((item) => item.path === location.pathname);
    return match ?? routeMeta[0];
  }, [location.pathname]);

  return (
    <div className="site-shell">
      <AnimatedBackground />
      <div className="site-shell__grain" aria-hidden="true" />

      <header className={`site-nav ${isScrolled ? 'site-nav--scrolled' : ''}`}>
        <div className="site-nav__inner">
          <Link className="brand-lockup" to="/">
            <span className="brand-lockup__eyebrow">HOLLOW BITS</span>
            <span className="brand-lockup__title">Digital studio for heavy ideas</span>
          </Link>

          <button
            type="button"
            className="site-nav__toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className={`site-nav__panel ${menuOpen ? 'site-nav__panel--open' : ''}`}>
            <nav className="site-nav__links">
              {routeMeta.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`site-nav__link ${item.path === location.pathname ? 'is-active' : ''}`}
                >
                  <span className="site-nav__link-stamp">{item.stamp}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="site-nav__status">
              <span className="site-nav__status-dot" />
              <div>
                <span className="site-nav__status-label">{activeRoute.kicker}</span>
                <strong>{activeRoute.stamp}</strong>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="site-main">
        <div className="site-main__frame" key={location.pathname} data-route-shell>
          <Outlet />
        </div>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div>
            <span className="site-footer__label">Current route</span>
            <strong>{activeRoute.summary}</strong>
          </div>
          <div>
            <span className="site-footer__label">Product mood</span>
            <strong>Silent by default. Visual by obsession.</strong>
          </div>
          <div>
            <span className="site-footer__label">Origin</span>
            <strong>ALLYX - desktop-first DAW study</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
