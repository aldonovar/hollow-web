import { useEffect, useState } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatedBackground } from '../AnimatedBackground';
import { routeMeta } from '../content';
import { useAuthStore } from '../stores/authStore';

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Use the shared auth store instead of a duplicate local listener
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { 
    setMenuOpen(false); 
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('[Layout] Logout error:', err);
      // Force navigate even if signOut fails
      navigate('/');
    }
  };

  // Friendly display name for the navbar
  const displayName = profile?.full_name
    || profile?.username
    || user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || '';

  // Avatar URL
  const avatarUrl = profile?.avatar_url
    || user?.user_metadata?.avatar_url
    || null;

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
              {session ? (
                <div style={{ position: 'relative' }}>
                  <button 
                    className="site-nav__cta" 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    style={{ 
                      background: userMenuOpen ? 'var(--purple)' : '#fff', 
                      color: userMenuOpen ? '#fff' : '#000',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          marginRight: 6,
                        }}
                      />
                    ) : (
                      <User className="site-nav__icon" size={16} style={{ marginRight: 6 }} />
                    )}
                    {displayName || 'Mi Cuenta'}
                  </button>
                  
                  {userMenuOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      background: 'var(--glass)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      minWidth: '180px',
                      boxShadow: 'var(--shadow)',
                      zIndex: 100
                    }}>
                      <Link 
                        to="/console" 
                        onClick={() => setUserMenuOpen(false)}
                        style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Inter, sans-serif' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <User size={15} />
                        Mi Consola
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--rose)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', cursor: 'pointer', background: 'transparent', border: 'none', width: '100%', fontFamily: 'Inter, sans-serif' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244,63,94,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <LogOut size={15} />
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link className="site-nav__login" to="/login">Log In</Link>
                  <Link className="site-nav__cta" to="/signup">
                    Sign Up
                    <User className="site-nav__icon" size={16} />
                  </Link>
                </>
              )}
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
            <Link to="/terms">Términos</Link>
            <Link to="/privacy">Privacidad</Link>
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
