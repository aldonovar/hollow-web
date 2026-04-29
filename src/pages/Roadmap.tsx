import { roadmapPhases } from '../content';
import { Btn, SectionHeader } from '../components/Editorial';
import { usePageMotion } from '../components/usePageMotion';

export function Roadmap() {
  const pageRef = usePageMotion();

  return (
    <div className="page-shell" ref={pageRef}>
      <section className="hero" style={{ minHeight: 'auto', paddingBottom: '2rem' }} data-page-hero>
        <div className="hero__badge"><span className="hero__badge-dot" /> Roadmap</div>
        <h1 className="hero__title" style={{ fontSize: 'clamp(2.8rem,6vw,5rem)' }}>
          Un roadmap que<br />también sabe decir no.
        </h1>
        <p className="hero__subtitle">
          Foundation → Depth → Web Console → Differentiation.
          Cada fase tiene criterios de salida reales, no promesas vagas.
        </p>
      </section>

      <section className="section">
        <SectionHeader
          kicker="Evolución"
          title={<>Cuatro fases hacia<br />un estudio sin compromisos.</>}
        />
        <div className="timeline" data-stagger>
          {roadmapPhases.map(phase => (
            <article className="timeline__item" key={phase.phase} data-stagger-item>
              <div className="timeline__dot" />
              <span className="timeline__phase">{phase.phase}</span>
              <h3 className="timeline__title">{phase.horizon}</h3>
              <p className="timeline__body">{phase.body}</p>
              <ul className="timeline__deliverables">
                {phase.deliverables.map(d => <li key={d}>{d}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-section__inner" data-reveal>
          <h2 className="cta-section__title">¿Quieres influir en la dirección?</h2>
          <p className="cta-section__desc">
            Los usuarios de la beta privada tienen voz directa en el roadmap.
            Entra antes de que las paredes sequen.
          </p>
          <Btn to="/contact">Solicitar acceso</Btn>
        </div>
      </section>
    </div>
  );
}
