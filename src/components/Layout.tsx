import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { User, Menu, X } from 'lucide-react';
import { navItems } from '../content';
import { AnimatedBackground } from '../AnimatedBackground';

export function Layout() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [location]);

    return (
        <div className="app-shell">
            <AnimatedBackground />

            {/* Global Navigation */}
            <nav className={`global-nav ${isScrolled ? 'scrolled' : ''}`}>
                <Link to="/" className="nav-brand">
                    <div className="brand-dot"></div>
                    <span>HOLLOW BITS</span>
                </Link>

                <div className={`nav-links ${menuOpen ? 'mobile-open' : ''}`}>
                    {navItems.map(item => (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="nav-actions">
                    <button className="nav-button ghost" title="Client Portal">
                        <User size={16} />
                    </button>
                    <Link to="/contact" className="nav-button primary">
                        Obtener Acceso
                    </Link>
                    <button
                        className="mobile-menu-toggle"
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{ display: 'none', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                    >
                        {menuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main>
                <Outlet />
            </main>

            {/* Global Footer */}
            <footer className="global-footer">
                <div>HOLLOW BITS by ALLYX & Ethereal Sounds.</div>
                <div>Redefiniendo el estándar técnico de producción DAW.</div>
            </footer>
        </div>
    );
}
