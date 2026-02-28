import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  capabilities,
  engineHighlights,
  faqs,
  heroStats,
  matrixLegend,
  navItems,
  roadmap,
  services
} from './content';

gsap.registerPlugin(ScrollTrigger);

const pillars = [
  'Engine reliability como feature de producto.',
  'Pro workflow para producir con menos clicks.',
  'Creative power para sesion, mix y performance.',
  'Intelligence accionable con foco en estudio real.',
  'Desktop quality con prioridad en Windows.'
];

function App() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Ultra smooth Lenis configuration for premium feel
    const lenis = new Lenis({
      duration: 1.5,
      lerp: 0.05,
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.2,
      infinite: false
    });

    lenis.on('scroll', ScrollTrigger.update);

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const updateScrollProgress = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      setScrollProgress(progress);
    };

    const closeOnResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', closeOnResize);
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', closeOnResize);
    };
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Intro fade
      gsap.from('.site-shell', {
        autoAlpha: 0,
        y: 20,
        duration: 1.5,
        ease: 'power3.out'
      });

      // Hero Text Lines Smooth Reveal
      gsap.from('.hero-line', {
        yPercent: 120,
        skewY: 3,
        autoAlpha: 0,
        duration: 1.6,
        stagger: 0.15,
        ease: 'power4.out',
        delay: 0.2
      });

      // General Reveal Elements
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((item) => {
        gsap.from(item, {
          autoAlpha: 0,
          y: 80,
          duration: 1.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            once: true
          }
        });
      });

      // Stagger Groups (Cards, Lists)
      gsap.utils.toArray<HTMLElement>('[data-stagger-group]').forEach((group) => {
        const elements = group.querySelectorAll<HTMLElement>('.stagger-item');
        gsap.from(elements, {
          autoAlpha: 0,
          y: 40,
          duration: 1.2,
          ease: 'power2.out',
          stagger: 0.15,
          scrollTrigger: {
            trigger: group,
            start: 'top 85%',
            once: true
          }
        });
      });

      // Surreal 3D Animations
      gsap.to('.surreal-orb', {
        y: -30,
        rotation: 2,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      gsap.to('.sea-grid', {
        backgroundPosition: '0px 100px',
        duration: 4,
        ease: 'none',
        repeat: -1
      });

      // Signal Path Animation
      const signalPath = gsap.utils.toArray<SVGPathElement>('.signal-path')[0];
      if (signalPath) {
        const pathLength = signalPath.getTotalLength();
        gsap.set(signalPath, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength
        });

        gsap.to(signalPath, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: '.signal-panel',
            start: 'top 75%',
            end: 'bottom 35%',
            scrub: true
          }
        });
      }
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, []);

  const handleNavClick = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMenuOpen(false);
  };

  return (
    <div ref={rootRef} className="site-shell">
      <div className="ambient-noise" aria-hidden="true" />
      <div
        className="progress-line"
        style={{ transform: `scaleX(${Math.max(0, Math.min(1, scrollProgress))})` }}
        aria-hidden="true"
      />

      <header className="topbar">
        <a href="#vision" className="brand" onClick={handleNavClick('vision')}>
          <div className="brand-mark" aria-hidden="true" />
          <div>
            HOLLOW BITS
            <small>ALLYX x Ethereal</small>
          </div>
        </a>

        <button className="menu-toggle" onClick={() => setMenuOpen((prev) => !prev)} aria-expanded={menuOpen}>
          {menuOpen ? 'CERRAR' : 'MENU'}
        </button>

        <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
          {navItems.map((item) => (
            <a key={item.id} href={`#${item.id}`} onClick={handleNavClick(item.id)}>
              {item.label}
            </a>
          ))}
          <a href="#contacto" className="nav-cta" onClick={handleNavClick('contacto')}>
            Solicitar acceso
          </a>
        </nav>
      </header>

      <main>
        {/* Full Bleed Surreal Hero */}
        <section id="vision" className="hero section-frame">
          <div className="hero-copy reveal">
            <p className="kicker">Escaparate Tecnico + Comercial</p>
            <h1>
              <span className="line-wrap"><span className="hero-line">El nuevo DAW</span></span>
              <span className="line-wrap"><span className="hero-line">de precision</span></span>
              <span className="line-wrap"><span className="hero-line">absoluta.</span></span>
            </h1>
            <p className="reveal" style={{ animationDelay: '0.4s' }}>
              HOLLOW BITS es un entorno desktop-first creado por ALLYX y Ethereal Sounds para competir con
              flujo pro, estabilidad inquebrantable y una identidad estetica radicalmente superior.
            </p>

            <div className="hero-actions reveal" style={{ animationDelay: '0.6s' }}>
              <a href="#hollow-bits" onClick={handleNavClick('hollow-bits')} className="button-primary">
                Explorar plataforma
              </a>
              <a href="#engine" onClick={handleNavClick('engine')} className="button-ghost">
                Ver stack tecnico
              </a>
            </div>

            <ul className="pillar-list reveal" style={{ animationDelay: '0.8s' }}>
              {pillars.map((pillar) => (
                <li key={pillar}>{pillar}</li>
              ))}
            </ul>
          </div>

          <div className="hero-visual reveal" aria-hidden="true">
            <div className="sea-grid" />
            <div className="horizon-line" />
            <div className="surreal-orb" />
          </div>
        </section>

        <section className="metrics reveal" data-stagger-group>
          {heroStats.map((item) => (
            <article key={item.label} className="metric-card stagger-item">
              <strong>{item.value}</strong>
              <h3>{item.label}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </section>

        <section id="hollow-bits" className="section-frame reveal">
          <div className="section-head">
            <p className="kicker">HOLLOW BITS Platform</p>
            <h2>Un ecosistema magnetico y validado.</h2>
            <p>
              Diseñado no solo para verse bien, sino para habilitar un performance sin fricciones.
              Aqui es donde el audio puro se encuentra con la estetica hiper-moderna.
            </p>
          </div>

          <div className="card-grid" data-stagger-group>
            {capabilities.map((item) => (
              <article key={item.title} className="glass-card stagger-item">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <ul>
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="engine" className="section-frame reveal">
          <div className="section-head">
            <p className="kicker">Engine Architecture</p>
            <h2>Performance orientado a la realidad, no promesas vacias.</h2>
            <p>
              Construimos HOLLOW BITS con metricas duras en mente: benchmarks A/B extremos, tolerancias minimas
              y fallback estructurados para garantizar confianza.
            </p>
          </div>

          <div className="engine-layout">
            <div className="engine-list" data-stagger-group>
              {engineHighlights.map((item) => (
                <article key={item.title} className="engine-item stagger-item">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>

            <div className="signal-panel reveal">
              <svg viewBox="0 0 640 260" role="img" aria-label="Flujo de telemetria del audio engine" style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 0 40px rgba(255, 77, 0, 0.4))' }}>
                <defs>
                  <linearGradient id="signal-gradient" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#ff4d00" />
                    <stop offset="52%" stopColor="#c8102e" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
                <rect x="8" y="8" width="624" height="244" rx="24" fill="rgba(10,5,5,0.8)" stroke="rgba(255,255,255,0.05)" />
                <path
                  className="signal-path"
                  d="M 24 152 C 88 152, 108 84, 160 84 C 212 84, 224 184, 292 184 C 362 184, 376 58, 430 58 C 484 58, 502 198, 568 198 C 604 198, 614 126, 618 126"
                  fill="none" stroke="url(#signal-gradient)" strokeWidth="4" strokeLinecap="round"
                />
                <circle cx="160" cy="84" r="6" fill="#ff4d00" />
                <circle cx="292" cy="184" r="6" fill="#ff4d00" />
                <circle cx="430" cy="58" r="6" fill="#ff4d00" />
                <circle cx="568" cy="198" r="6" fill="#ff4d00" />
              </svg>
              <div className="signal-caption">
                <strong>Telemetria de Rendering</strong>
                <span>drift p95 36ms / p99 95ms / lag p95 32ms</span>
              </div>
            </div>
          </div>

          <div className="legend-grid" data-stagger-group>
            {matrixLegend.map((item) => (
              <article key={item.value} className="legend-card stagger-item">
                <strong>{item.value}</strong>
                <h3>{item.label}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="ecosistema" className="section-frame reveal">
          <div className="section-head">
            <p className="kicker">Ethereal Sounds Integration</p>
            <h2>Un ecosistema disrruptivo impulsado por talento real.</h2>
            <p>
              Ethereal Sounds lidera la direccion de audio aportando recursos y produccion pura para enriquecer
              todo el entorno de HOLLOW BITS en un entorno sin limites.
            </p>
          </div>

          <div className="engine-layout">
            <div className="surreal-gem-container reveal">
              <div className="surreal-gem" />
            </div>

            <div className="service-grid" style={{ gridTemplateColumns: '1fr', padding: 0 }} data-stagger-group>
              {services.map((service) => (
                <article key={service.title} className="service-card stagger-item">
                  <h3>{service.title}</h3>
                  <p>{service.body}</p>
                  <ul>
                    {service.outcomes.map((outcome) => (
                      <li key={outcome}>{outcome}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>

          <div className="platform-row" style={{ marginTop: '3rem' }} data-stagger-group>
            <article className="platform-card stagger-item">
              <h3>Windows First</h3>
              <p>Optimizacion profunda para produccion extrema en entornos nativos desktop de Windows.</p>
            </article>
            <article className="platform-card stagger-item">
              <h3>Linux Expansion</h3>
              <p>Escalabilidad lista para usuarios avanzados que priorizan un stack audiófilo sin sobrecarga.</p>
            </article>
            <article className="platform-card stagger-item">
              <h3>macOS Ready (Próximamente)</h3>
              <p>Compatibilidad nativa con flujos universales y hardware Apple Silicon en fases venideras.</p>
            </article>
          </div>
        </section>

        <section id="roadmap" className="section-frame reveal">
          <div className="section-head">
            <p className="kicker">Roadmap</p>
            <h2>Construido por etapas bajo protocolos inflexibles.</h2>
            <p>
              Evolucion trimestral definida. Sin especulacion, cada fase esta ligada a metas precisas de
              adopcion de workflow y estabilidad global.
            </p>
          </div>

          <div className="timeline" data-stagger-group>
            {roadmap.map((item) => (
              <article key={item.phase} className="timeline-item stagger-item">
                <h3>{item.phase}</h3>
                <p>{item.focus}</p>
                <ul>
                  {item.deliverables.map((deliverable) => (
                    <li key={deliverable}>{deliverable}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="section-frame reveal faq-section">
          <div className="section-head">
            <p className="kicker">FAQ</p>
            <h2>Dudas frecuentes resueltas directamente.</h2>
          </div>
          <div className="faq-list" data-stagger-group>
            {faqs.map((item) => (
              <details key={item.question} className="faq-item stagger-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="contacto" className="section-frame contact reveal">
          <div className="contact-copy">
            <p className="kicker">Connect</p>
            <h2>Hagamos contacto en la frontera creativa.</h2>
            <p>
              Estamos listos para el rollout y pruebas en ambientes profesionales.
              Descubre las capacidades que haran la diferencia.
            </p>
          </div>
          <div className="contact-actions">
            <a href="mailto:hollowbits@allyxorb.com" className="button-primary">Agendar reunion</a>
            <a href="https://github.com/aldonovar/hollow-web" target="_blank" rel="noreferrer" className="button-ghost">
              Visitar Repositorio
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>HOLLOW BITS by ALLYX & Ethereal Sounds.</p>
        <span>Redefiniendo la plataforma de creación en Windows.</span>
      </footer>
    </div>
  );
}

export default App;
