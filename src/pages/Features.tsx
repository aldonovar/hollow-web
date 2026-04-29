import { coreFeatures } from '../content';
import { Btn, SectionHeader } from '../components/Editorial';
import { usePageMotion } from '../components/usePageMotion';
import { Cpu, Users, LayoutGrid, Sparkles, HardDrive, Sliders, Zap, Shield, Layers } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = { Cpu, Users, LayoutGrid, Sparkles, HardDrive, Sliders };

const deepFeatures = [
  { icon: Zap, title: 'Scheduler Dual', body: 'Worklet-clock para precisión absoluta con interval fallback inteligente. El transporte nunca suena como una aproximación.' },
  { icon: Shield, title: 'Quality Gates', body: 'Typecheck, tests, build y smoke gates. Ningún release candidate si un gate está rojo. Disciplina real de ingeniería.' },
  { icon: Layers, title: 'Graph Patching Incremental', body: 'Cambios de routing y mix sin reconnect chaos. Estabilidad que se siente en cada sesión.' },
];

export function Features() {
  const pageRef = usePageMotion();

  return (
    <div className="page-shell" ref={pageRef}>
      <section className="hero" style={{ minHeight: 'auto', paddingBottom: '2rem' }} data-page-hero>
        <div className="hero__badge"><span className="hero__badge-dot" /> Feature Deep Dive</div>
        <h1 className="hero__title" style={{ fontSize: 'clamp(2.8rem,6vw,5rem)' }}>
          Cada feature tiene<br />columna técnica debajo.
        </h1>
        <p className="hero__subtitle">
          No vendemos capturas bonitas. Cada capacidad que mostramos ya existe en el motor,
          respaldada por benchmarks y quality gates reales.
        </p>
      </section>

      <section className="section">
        <SectionHeader kicker="Core Capabilities" title={<>Seis pilares que<br />sostienen el estudio.</>} />
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

      <section className="section">
        <SectionHeader
          kicker="Bajo el capó"
          title={<>La disciplina técnica<br />que hace posible el gesto.</>}
          description="Detrás de cada interacción fluida hay arquitectura pensada para no fallar cuando el show ya empezó."
        />
        <div className="feature-bento" data-stagger>
          {deepFeatures.map(f => (
            <article className="glass-card" key={f.title} data-stagger-item>
              <div className="glass-card__glow" />
              <div className="glass-card__icon"><f.icon size={22} /></div>
              <h3 className="glass-card__title">{f.title}</h3>
              <p className="glass-card__text">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-section__inner" data-reveal>
          <h2 className="cta-section__title">¿Listo para probarlo?</h2>
          <p className="cta-section__desc">Abre la consola web o descarga la versión desktop. El mismo estudio, tu elección.</p>
          <div className="hero__actions">
            <Btn to="/console">Abrir Console</Btn>
            <Btn to="/pricing" variant="ghost">Ver planes</Btn>
          </div>
        </div>
      </section>
    </div>
  );
}
