import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { User, Menu, X, ArrowRight } from 'lucide-react';
import {
  capabilities,
  engineHighlights,
  heroStats,
  matrixLegend,
  navItems,
  roadmap,
  services
} from './content';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Initialize smooth scrolling and GSAP animations
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom ease
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenis.on('scroll', ScrollTrigger.update);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lenis.on('scroll', (e: any) => {
      setIsScrolled(e.scroll > 50);
    });

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  // Global Animations Setup
  useEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Initial Hero Reveal
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      tl.fromTo('.global-nav',
        { yPercent: -100, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 1, delay: 0.2 }
      )
        .fromTo('.hero-subtitle',
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.8 },
          '-=0.4'
        )
        .fromTo('.hero-line',
          { yPercent: 120, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, stagger: 0.1, duration: 1.2 },
          '-=0.6'
        )
        .fromTo('.hero-description',
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 1 },
          '-=0.8'
        )
        .fromTo('.hero-visual',
          { autoAlpha: 0, scale: 0.9 },
          { autoAlpha: 1, scale: 1, duration: 2, ease: 'power2.out' },
          '-=1.2'
        );

      // 2. Scroll Reveal for Sections
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((elem) => {
        gsap.fromTo(elem,
          { autoAlpha: 0, y: 60 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: elem,
              start: 'top 85%',
              once: true
            }
          }
        );
      });

      // 3. Stagger Groups (Cards, Lists)
      gsap.utils.toArray<HTMLElement>('.stagger-group').forEach((group) => {
        const items = group.querySelectorAll('.stagger-item');
        gsap.fromTo(items,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: group,
              start: 'top 85%',
              once: true
            }
          }
        );
      });

    }, rootRef);

    return () => ctx.revert();
  }, []);

  const handleNavClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="app-shell">
      {/* --- ABLETON INSPIRED NAVBAR --- */}
      <nav className={`global-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-brand">
          <div className="brand-dot"></div>
          <span>HOLLOW BITS</span>
        </div>

        <div className={`nav-links ${menuOpen ? 'mobile-open' : ''}`}>
          {navItems.map(item => (
            <a key={item.id} href={`#${item.id}`} className="nav-link" onClick={handleNavClick(item.id)}>
              {item.label}
            </a>
          ))}
        </div>

        <div className="nav-actions">
          <button className="nav-button ghost">
            <User size={16} />
          </button>
          <button className="nav-button primary">
            Get Access
          </button>
          <button className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <main>
        {/* --- KYMA INSPIRED HERO --- */}
        <section id="vision" className="hero container">
          <div className="hero-content">
            <span className="hero-subtitle">Technical & Commercial Display</span>
            <h1 className="hero-title">
              <span className="line-wrap"><span className="hero-line" style={{ display: 'inline-block' }}>The standard for</span></span>
              <span className="line-wrap"><span className="hero-line" style={{ display: 'inline-block' }}>absolute precision.</span></span>
            </h1>
            <p className="hero-description">
              HOLLOW BITS is a desktop-first environment created by ALLYX and Ethereal Sounds. Engineered for professional workflows, unyielding stability, and a radically superior aesthetic identity.
            </p>
          </div>
          <div className="hero-visual" aria-hidden="true"></div>
        </section>

        {/* --- STATS GRID --- */}
        <div className="container" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="stats-grid stagger-group">
            {heroStats.map(stat => (
              <div key={stat.label} className="stat-item stagger-item">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
                <span className="stat-detail">{stat.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- PLATFORM ECOSYSTEM --- */}
        <section id="hollow-bits" className="section container">
          <header className="section-header reveal">
            <span className="section-label">Hollow Bits Platform</span>
            <h2 className="section-title">A magnetic and validated ecosystem.</h2>
            <p className="section-description">
              Designed not just to look pristine, but to enable frictionless performance. Where pure audio meets hyper-modern aesthetics.
            </p>
          </header>

          <div className="card-grid stagger-group">
            {capabilities.map(cap => (
              <article key={cap.title} className="card stagger-item">
                <h3 className="card-title">{cap.title}</h3>
                <p className="card-text">{cap.body}</p>
                <ul className="card-list">
                  {cap.bullets.map((bullet, idx) => (
                    <li key={idx} className="card-list-item">{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* --- ENGINE ARCHITECTURE --- */}
        <section id="engine" className="section container">
          <header className="section-header reveal">
            <span className="section-label">Engine Architecture</span>
            <h2 className="section-title">Performance defined by reality, not promises.</h2>
            <p className="section-description">
              Built with hard metrics: extreme A/B benchmarks, minimal tolerances, and structured fallbacks for absolute confidence.
            </p>
          </header>

          <div className="grid-2">
            <div className="timeline">
              {engineHighlights.map((hl, idx) => (
                <div key={hl.title} className={`timeline-item ${idx === 0 ? 'active' : ''} reveal`}>
                  <h3 className="timeline-focus" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{hl.title}</h3>
                  <p className="card-text">{hl.body}</p>
                </div>
              ))}
            </div>

            <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ height: '300px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>Telemetry Visualizer Placeholder</span>
              </div>
              <div className="grid-3 stagger-group" style={{ gap: '1rem' }}>
                {matrixLegend.map(lg => (
                  <div key={lg.value} className="card stagger-item" style={{ padding: '1.5rem' }}>
                    <span className="stat-label" style={{ color: lg.value === 'PASS' ? 'var(--text-primary)' : lg.value === 'WARN' ? 'var(--accent-primary)' : '#ff2a00' }}>{lg.value}</span>
                    <h4 style={{ fontSize: '1rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>{lg.label}</h4>
                    <p className="stat-detail" style={{ fontSize: '0.75rem' }}>{lg.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- ECOSYSTEM (Ethereal Sounds) --- */}
        <section id="ecosistema" className="section container">
          <header className="section-header reveal">
            <span className="section-label">Integration</span>
            <h2 className="section-title">Driven by real talent.</h2>
          </header>

          <div className="card-grid stagger-group">
            {services.map(srv => (
              <article key={srv.title} className="card stagger-item" style={{ background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '3rem' }}>
                <h3 className="card-title">{srv.title}</h3>
                <p className="card-text">{srv.body}</p>
                <ul className="card-list">
                  {srv.outcomes.map((out, idx) => (
                    <li key={idx} className="card-list-item">{out}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* --- ROADMAP --- */}
        <section id="roadmap" className="section container">
          <header className="section-header reveal">
            <span className="section-label">Roadmap</span>
            <h2 className="section-title">Built in stages under inflexible protocols.</h2>
          </header>

          <div className="timeline stagger-group" style={{ maxWidth: '800px' }}>
            {roadmap.map((rm) => (
              <div key={rm.phase} className="timeline-item stagger-item">
                <div className="timeline-phase">{rm.phase}</div>
                <h3 className="timeline-focus">{rm.focus}</h3>
                <ul className="timeline-list">
                  {rm.deliverables.map((del, i) => (
                    <li key={i} className="timeline-list-item">{del}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* --- CTA --- */}
        <section id="contacto" className="section container reveal" style={{ borderBottom: 'none', textAlign: 'center', padding: '12rem 0' }}>
          <h2 className="section-title" style={{ maxWidth: '800px', margin: '0 auto 2rem' }}>Ready for the frontier?</h2>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="nav-button primary" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
              Schedule Meeting <ArrowRight size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginLeft: '0.5rem' }} />
            </button>
          </div>
        </section>

      </main>

      {/* --- FOOTER --- */}
      <footer className="global-footer">
        <div>HOLLOW BITS by ALLYX & Ethereal Sounds.</div>
        <div>Redefiniendo la plataforma de creación en Windows.</div>
      </footer>
    </div>
  );
}

export default App;
