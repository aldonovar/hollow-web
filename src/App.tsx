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
import { AnimatedBackground } from './AnimatedBackground';

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
        )
        .to('.spectral-line', {
          scaleX: 1,
          duration: 1.5,
          stagger: 0.2,
          ease: 'power3.inOut'
        }, '-=1.0');

      // 1.5 Scroll Parallax for Hero
      gsap.to('.hero-content', {
        y: 100, // Move down slightly as user scrolls down
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
      gsap.to('.hero-visual', {
        y: 200, // Moves down faster than content for deep parallax
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

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

      // 4. Continuous Flow Animations
      gsap.to('.data-stream', {
        strokeDashoffset: -100,
        duration: 2,
        ease: 'none',
        repeat: -1
      });
      gsap.to('.data-stream-2', {
        strokeDashoffset: 100,
        duration: 4,
        ease: 'none',
        repeat: -1
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
      <AnimatedBackground />
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
            Obtener Acceso
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
            <span className="hero-subtitle">Muestra Técnica & Comercial</span>
            <h1 className="hero-title">
              <span className="line-wrap"><span className="hero-line" style={{ display: 'inline-block' }}>El estándar de</span></span>
              <span className="line-wrap"><span className="hero-line" style={{ display: 'inline-block' }}>precisión absoluta.</span></span>
            </h1>
            <p className="hero-description">
              HOLLOW BITS es un entorno desktop-first creado por ALLYX y Ethereal Sounds. Diseñado para flujos de trabajo profesionales, estabilidad inquebrantable y una identidad estética radicalmente superior.
            </p>
          </div>
          <div className="hero-visual" aria-hidden="true" style={{ position: 'relative' }}>
            {/* Adding subtle animated elements mimicking high-end DAW spectral analysis */}
            <div className="spectral-line" style={{ width: '100%', height: '1px', background: 'var(--text-secondary)', position: 'absolute', top: '30%', transform: 'scaleX(0)', transformOrigin: 'left' }} />
            <div className="spectral-line" style={{ width: '100%', height: '1px', background: 'var(--text-secondary)', position: 'absolute', top: '60%', transform: 'scaleX(0)', transformOrigin: 'right' }} />
          </div>
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
            <span className="section-label">Plataforma Hollow Bits</span>
            <h2 className="section-title">Un ecosistema magnético y validado.</h2>
            <p className="section-description">
              Diseñado no solo para lucir impecable, sino para permitir un rendimiento sin fricciones. Donde el audio puro se encuentra con la estética hiper-moderna.
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
            <span className="section-label">Arquitectura del Motor</span>
            <h2 className="section-title">Rendimiento definido por la realidad, no por promesas.</h2>
            <p className="section-description">
              Construido con métricas duras: benchmarks A/B extremos, tolerancias mínimas y respaldos estructurados para una confianza absoluta.
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
              <div style={{ height: '300px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-strong)" strokeWidth="1" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  <path className="data-stream" d="M 0 150 Q 100 50 200 150 T 400 150 T 600 150 T 800 150" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeDasharray="10 10" />
                  <path className="data-stream-2" d="M 0 200 Q 150 250 300 100 T 600 200 T 900 100" fill="none" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="5 15" />
                </svg>
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>TELEMETRY.VISUALIZER [LIVE]</div>
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
            <span className="section-label">Integración</span>
            <h2 className="section-title">Impulsado por talento real.</h2>
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
            <span className="section-label">Hoja de Ruta</span>
            <h2 className="section-title">Construido en etapas bajo protocolos inflexibles.</h2>
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
          <h2 className="section-title" style={{ maxWidth: '800px', margin: '0 auto 2rem' }}>¿Listo para la frontera?</h2>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="nav-button primary" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
              Agendar Reunión <ArrowRight size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginLeft: '0.5rem' }} />
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
