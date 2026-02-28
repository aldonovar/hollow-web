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
    const lenis = new Lenis({
      duration: 1.12,
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.1,
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
      if (window.innerWidth >= 980) {
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
      gsap.from('.site-shell', {
        autoAlpha: 0,
        y: 16,
        duration: 1,
        ease: 'power3.out'
      });

      gsap.from('.hero-line', {
        yPercent: 120,
        duration: 1,
        stagger: 0.1,
        ease: 'power4.out'
      });

      gsap.utils.toArray<HTMLElement>('.reveal').forEach((item) => {
        gsap.from(item, {
          autoAlpha: 0,
          y: 60,
          duration: 1.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 84%',
            once: true
          }
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-stagger-group]').forEach((group) => {
        const elements = group.querySelectorAll<HTMLElement>('.stagger-item');
        gsap.from(elements, {
          autoAlpha: 0,
          y: 36,
          duration: 0.9,
          ease: 'power2.out',
          stagger: 0.11,
          scrollTrigger: {
            trigger: group,
            start: 'top 82%',
            once: true
          }
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((layer) => {
        const speed = Number(layer.dataset.parallax ?? 0.18);
        gsap.to(layer, {
          yPercent: speed * -50,
          ease: 'none',
          scrollTrigger: {
            trigger: layer,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      });

      gsap.to('.floating-orb', {
        y: -14,
        duration: 4.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      gsap.to('.floating-monolith', {
        y: 18,
        rotation: 1.6,
        duration: 6.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

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
          <span className="brand-mark" aria-hidden="true" />
          <span>
            HOLLOW BITS
            <small>ALLYX x Ethereal Sounds</small>
          </span>
        </a>

        <button className="menu-toggle" onClick={() => setMenuOpen((prev) => !prev)} aria-expanded={menuOpen}>
          Menu
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
        <section id="vision" className="hero section-frame">
          <div className="hero-copy reveal">
            <p className="kicker">Escaparate tecnico + comercial</p>
            <h1>
              <span className="line-wrap">
                <span className="hero-line">El nuevo DAW de precision</span>
              </span>
              <span className="line-wrap">
                <span className="hero-line">para productores que exigen</span>
              </span>
              <span className="line-wrap">
                <span className="hero-line">estetica, potencia y control.</span>
              </span>
            </h1>
            <p>
              HOLLOW BITS es un entorno desktop-first creado por ALLYX y Ethereal Sounds para competir con
              flujo pro, estabilidad de alto nivel y una identidad sonora/visual radicalmente refinada.
            </p>

            <div className="hero-actions">
              <a href="#hollow-bits" onClick={handleNavClick('hollow-bits')} className="button-primary">
                Explorar plataforma
              </a>
              <a href="#engine" onClick={handleNavClick('engine')} className="button-ghost">
                Ver stack tecnico
              </a>
            </div>

            <ul className="pillar-list" data-stagger-group>
              {pillars.map((pillar) => (
                <li key={pillar} className="stagger-item">
                  {pillar}
                </li>
              ))}
            </ul>
          </div>

          <div className="hero-visual reveal" aria-hidden="true">
            <div className="horizon" data-parallax="0.08" />
            <div className="void-orb floating-orb" data-parallax="0.22" />
            <div className="monolith floating-monolith" data-parallax="0.26" />
            <div className="glow-band" data-parallax="0.13" />
            <div className="grid-haze" data-parallax="0.18" />
          </div>
        </section>

        <section className="section-frame metrics reveal" data-stagger-group>
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
            <h2>Un DAW completo con narrativa de producto y validacion real.</h2>
            <p>
              Esta web presenta a HOLLOW BITS como producto tecnico-comercial: lo que hace, por que importa,
              y como habilita resultados de estudio con una experiencia premium.
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
            <p className="kicker">Engine and Quality</p>
            <h2>Arquitectura de audio orientada a datos, no a promesas vacias.</h2>
            <p>
              La propuesta tecnica esta traducida a lenguaje comercial comprensible: estabilidad comprobable,
              comparativas claras y criterios de release que elevan confianza para usuarios profesionales.
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

            <div className="signal-panel">
              <svg viewBox="0 0 640 260" role="img" aria-label="Flujo de telemetria del audio engine">
                <defs>
                  <linearGradient id="signal-gradient" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#ff914d" />
                    <stop offset="52%" stopColor="#e54b6f" />
                    <stop offset="100%" stopColor="#84a6ff" />
                  </linearGradient>
                </defs>
                <rect x="8" y="8" width="624" height="244" rx="24" className="signal-plate" />
                <path
                  className="signal-path"
                  d="M 24 152 C 88 152, 108 84, 160 84 C 212 84, 224 184, 292 184 C 362 184, 376 58, 430 58 C 484 58, 502 198, 568 198 C 604 198, 614 126, 618 126"
                />
                <circle className="signal-dot" cx="160" cy="84" r="6" />
                <circle className="signal-dot" cx="292" cy="184" r="6" />
                <circle className="signal-dot" cx="430" cy="58" r="6" />
                <circle className="signal-dot" cx="568" cy="198" r="6" />
              </svg>
              <div className="signal-caption">
                <strong>Performance Gate</strong>
                <span>drift p95 36ms / p99 95ms / lag p95 32ms / loop p99 34ms</span>
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
            <p className="kicker">Ethereal Sounds Ecosystem</p>
            <h2>Servicio integral para artistas, sellos y marcas sonoras.</h2>
            <p>
              HOLLOW BITS es el centro tecnologico del ecosistema. Ethereal Sounds aporta direccion de talento,
              produccion discografica y ejecucion de proyectos con estandar premium.
            </p>
          </div>

          <div className="service-grid" data-stagger-group>
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

          <div className="platform-row" data-stagger-group>
            <article className="platform-card stagger-item">
              <h3>Windows First</h3>
              <p>Objetivo principal actual: rendimiento estable para produccion diaria en desktop nativo.</p>
            </article>
            <article className="platform-card stagger-item">
              <h3>Linux Next</h3>
              <p>Fase de expansion para estudios y perfiles tecnicos que buscan un stack abierto y potente.</p>
            </article>
            <article className="platform-card stagger-item">
              <h3>macOS Incoming</h3>
              <p>Compatibilidad prevista para integrar flujos creativos mixtos en equipos de alto rendimiento.</p>
            </article>
          </div>
        </section>

        <section id="roadmap" className="section-frame reveal">
          <div className="section-head">
            <p className="kicker">Roadmap</p>
            <h2>Plan de evolucion anual para paridad pro y diferenciacion.</h2>
            <p>
              El roadmap comunica una direccion clara: primero determinismo y estabilidad, luego profundidad pro,
              finalmente diferenciacion por AI accionable y colaboracion de nueva generacion.
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
            <h2>Preguntas clave del publico tecnico y comercial.</h2>
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
            <p className="kicker">Launch and partnerships</p>
            <h2>Listos para presentar HOLLOW BITS en mercado global.</h2>
            <p>
              El sitio ya queda preparado como base para GitHub + Vercel: storytelling, contenido tecnico-comercial,
              animacion premium y estructura escalable para futuras versiones.
            </p>
          </div>
          <div className="contact-actions">
            <a href="mailto:hollowbits@allyxorb.com" className="button-primary">Agendar reunion</a>
            <a href="https://github.com/aldonovar/hollow-web" target="_blank" rel="noreferrer" className="button-ghost">
              Ver repositorio
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>HOLLOW BITS - producido por ALLYX, diseno sonoro y talento por Ethereal Sounds.</p>
        <span>Desktop-first DAW. Windows ahora. Linux y macOS proximamente.</span>
      </footer>
    </div>
  );
}

export default App;
