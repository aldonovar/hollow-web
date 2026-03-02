import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
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
            <div className="noise-overlay"></div>
            <AnimatedBackground />

            {/* HUD Navigation */}
            <nav className={`global-nav ${isScrolled ? 'scrolled' : ''}`}>
                {/* Left: Logo */}
                <Link to="/" className="nav-brand">
                    <img
                        src="/hollow-bits-logo.svg"
                        alt="HOLLOW BITS"
                        className="brand-logo"
                        width={160}
                        height={50}
                    />
                </Link>

                {/* Center: Nav links */}
                <div className={`nav-links ${menuOpen ? 'mobile-open' : ''}`}>
                    {navItems.map((item, idx) => (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <span className="nav-link-index">{String(idx + 1).padStart(2, '0')}</span>
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* Right: Status indicator */}
                <div className="nav-actions">
                    <div className="nav-status">
                        <span className="status-dot"></span>
                        <span className="status-text">DAW v0.9 ALPHA</span>
                    </div>
                    <button
                        className="mobile-menu-toggle"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main>
                <Outlet />
            </main>

            {/* Global Footer — HUD bottom bar */}
            <footer className="global-footer">
                <span>HOLLOW BITS — ALLYX × ETHEREAL SOUNDS</span>
                <span className="footer-mid">AUDIO ENGINE ARCHITECTURE</span>
                <span>© 2025 — ALL RIGHTS RESERVED</span>
            </footer>
        </div>
    );
}
