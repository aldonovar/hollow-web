import { consoleFeatures } from '../content';
import { Btn, SectionHeader } from '../components/Editorial';
import { usePageMotion } from '../components/usePageMotion';
import { Globe, Link as LinkIcon, Cloud, Shield, Monitor } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = { Globe, Link: LinkIcon, Cloud, Shield };

export function Console() {
  const pageRef = usePageMotion();

  return (
    <div className="page-shell" ref={pageRef}>
      <section className="hero" style={{ minHeight: 'auto', paddingBottom: '2rem' }} data-page-hero>
        <div className="hero__badge"><span className="hero__badge-dot" /> Web Console</div>
        <h1 className="hero__title" style={{ fontSize: 'clamp(2.8rem,6vw,5rem)' }}>
          Tu estudio completo<br />en el navegador.
        </h1>
        <p className="hero__subtitle">
          Inicia sesión y abre HOLLOW BITS directamente en tu navegador.
          El mismo motor, la misma interfaz. Colabora en tiempo real compartiendo un enlace.
        </p>
        <div className="hero__actions">
          <Btn to="/contact">Solicitar acceso beta</Btn>
          <Btn to="/pricing" variant="ghost">Ver planes</Btn>
        </div>
      </section>

      <section className="console-section">
        <div className="console-preview">
          <div className="console-preview__info">
            <SectionHeader
              kicker="Cómo funciona"
              title={<>Regístrate. Abre.<br />Produce. Comparte.</>}
            />
            {consoleFeatures.map(f => {
              const Icon = iconMap[f.icon] || Monitor;
              return (
                <div className="console-preview__feature" key={f.title}>
                  <div className="console-preview__feature-icon"><Icon /></div>
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="daw-preview" data-reveal style={{ aspectRatio: '4/3' }}>
            <div className="daw-preview__bar">
              <span className="daw-preview__dot" />
              <span className="daw-preview__dot" />
              <span className="daw-preview__dot" />
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '.1em' }}>
                HOLLOW BITS CONSOLE — LIVE SESSION
              </span>
            </div>
            <div className="daw-preview__body">
              <div className="daw-preview__sidebar">
                {[0,1,2,3,4,5,6].map(i => (
                  <div key={i} className={`daw-preview__sidebar-item ${i === 0 ? 'daw-preview__sidebar-item--active' : ''}`} />
                ))}
              </div>
              <div className="daw-preview__tracks">
                {['#e11d48','#a855f7','#c084fc','#f43f5e','#ec4899','#fb923c','#8b5cf6'].map((c, i) => (
                  <div key={i} className="daw-preview__track" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="daw-preview__track-color" style={{ background: c }} />
                    <div className="daw-preview__track-clip" style={{ width: `${40 + (i * 8) % 50}%`, background: `${c}33` }} />
                  </div>
                ))}
              </div>
              <div className="daw-preview__mixer">
                {[80,55,90,65,70,50,85].map((h, i) => (
                  <div key={i} className="daw-preview__meter">
                    <div className="daw-preview__meter-fill" style={{ height: `${h}%` }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="daw-preview__shimmer" />
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-section__inner" data-reveal>
          <h2 className="cta-section__title">Colaboración sin fricciones.</h2>
          <p className="cta-section__desc">
            Comparte un enlace como en Canva. Cualquier persona con acceso puede editar tu proyecto en tiempo real.
            Sin instalaciones, sin configuración.
          </p>
          <Btn to="/contact">Unirse a la beta</Btn>
        </div>
      </section>
    </div>
  );
}
