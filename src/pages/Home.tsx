import { heroMetrics, coreFeatures } from '../content';
import { Btn, MetricCard, SectionHeader } from '../components/Editorial';
import { usePageMotion } from '../components/usePageMotion';
import { Cpu, Users, LayoutGrid, Sparkles, HardDrive, Sliders } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = { Cpu, Users, LayoutGrid, Sparkles, HardDrive, Sliders };

function DAWPreview() {
  const tracks = [
    { name: 'BOMBO', color: '#e11d48', clipW: '70%' },
    { name: 'SUB', color: '#a855f7', clipW: '55%' },
    { name: 'ATMO', color: '#c084fc', clipW: '85%' },
    { name: 'LEAD', color: '#f43f5e', clipW: '45%' },
    { name: 'PAD', color: '#ec4899', clipW: '65%' },
  ];

  return (
    <div className="daw-preview" data-reveal>
      <div className="daw-preview__bar">
        <span className="daw-preview__dot" />
        <span className="daw-preview__dot" />
        <span className="daw-preview__dot" />
      </div>
      <div className="daw-preview__body">
        <div className="daw-preview__sidebar">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className={`daw-preview__sidebar-item ${i === 1 ? 'daw-preview__sidebar-item--active' : ''}`} />
          ))}
        </div>
        <div className="daw-preview__tracks">
          {tracks.map(t => (
            <div key={t.name} className="daw-preview__track" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="daw-preview__track-color" style={{ background: t.color }} />
              <div className="daw-preview__track-clip" style={{ width: t.clipW, background: `${t.color}33` }} />
            </div>
          ))}
        </div>
        <div className="daw-preview__mixer">
          {[75, 60, 85, 45, 55].map((h, i) => (
            <div key={i} className="daw-preview__meter">
              <div className="daw-preview__meter-fill" style={{ height: `${h}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="daw-preview__shimmer" />
    </div>
  );
}

export function Home() {
  const pageRef = usePageMotion();

  return (
    <div className="page-shell" ref={pageRef}>
      {/* HERO */}
      <section className="hero" data-page-hero>
        <div className="hero__glow hero__glow--purple" />
        <div className="hero__glow hero__glow--rose" />
        <div className="hero__badge">
          <span className="hero__badge-dot" />
          Desktop + Web — Private Beta
        </div>
        <h1 className="hero__title">
          Tu estudio no debería
          <br />sentirse más pequeño
          <br />que tu idea.
        </h1>
        <p className="hero__subtitle">
          HOLLOW BITS fusiona rendimiento nativo, colaboración en tiempo real y una
          estética cinematográfica. Desktop y web. Un solo estudio sin límites.
        </p>
        <div className="hero__actions">
          <Btn to="/console">Abrir Console</Btn>
          <Btn to="/pricing" variant="ghost">Ver planes</Btn>
        </div>
        <DAWPreview />
      </section>

      {/* METRICS */}
      <section className="section">
        <div className="metric-strip" data-stagger>
          {heroMetrics.map(m => (
            <div key={m.label} data-stagger-item><MetricCard item={m} /></div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <SectionHeader
          kicker="¿Por qué HOLLOW BITS?"
          title={<>Lo que otros prometen,<br />nosotros ya ejecutamos.</>}
          description="Cada feature está respaldada por código real, no por mockups. El motor ya corre, la interfaz ya responde, el workflow ya existe."
        />
        <div className="feature-grid" data-stagger>
          {coreFeatures.map(f => {
            const Icon = iconMap[f.icon] || Cpu;
            return (
              <article className="glass-card" key={f.title} data-stagger-item>
                <div className="glass-card__glow" />
                <div className="glass-card__icon"><Icon size={22} /></div>
                <h3 className="glass-card__title">{f.title}</h3>
                <p className="glass-card__text">{f.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-section__inner" data-reveal>
          <h2 className="cta-section__title">
            El futuro de la producción
            <br />musical empieza aquí.
          </h2>
          <p className="cta-section__desc">
            Únete a la beta privada y sé de los primeros en experimentar un DAW
            construido sin compromisos.
          </p>
          <div className="hero__actions">
            <Btn to="/console">Comenzar gratis</Btn>
            <Btn to="/features" variant="ghost">Explorar features</Btn>
          </div>
        </div>
      </section>
    </div>
  );
}
