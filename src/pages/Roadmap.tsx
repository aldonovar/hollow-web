import { roadmapPhases, roadmapPrinciples } from '../content';
import { LinkPill, SectionIntro } from '../components/Editorial';
import { usePageMotion } from '../components/usePageMotion';

export function Roadmap() {
  const pageRef = usePageMotion();

  return (
    <div className="page-shell" ref={pageRef}>
      <section className="page-hero page-hero--split" data-page-hero>
        <div>
          <span className="eyebrow-tag">Future states - HB-03</span>
          <h1 className="page-hero__title">
            Un roadmap sirve
            <br />
            cuando tambien sabe decir no.
          </h1>
          <p className="page-hero__body">
            La evolucion de HOLLOW BITS no es una lluvia de features. Es una secuencia
            de capas: primero determinismo, luego profundidad, despues performance y al
            final una diferencia que no pueda confundirse con maquillaje.
          </p>
        </div>

        <div className="page-hero__aside">
          <span className="page-hero__aside-kicker">North star</span>
          <p>
            Construir un DAW desktop-first que compita con Ableton y Logic en casos
            clave y los supere cuando la estabilidad, el workflow y la inteligencia ya
            no pueden ir separados.
          </p>
          <LinkPill to="/contact" quiet>
            Sumarse al acceso temprano
          </LinkPill>
        </div>
      </section>

      <section className="editorial-section">
        <SectionIntro
          kicker="Sequence"
          title={
            <>
              Foundation.
              <br />
              Parity.
              <br />
              Differentiation.
            </>
          }
          description="El roadmap maestro ya esta escrito en la app madre. Esta pagina lo traduce a una secuencia mas deseable y menos burocratica."
        />

        <div className="timeline-grid" data-stagger>
          {roadmapPhases.map((phase) => (
            <article className="timeline-card" key={phase.phase} data-stagger-item>
              <span className="timeline-card__phase">{phase.phase}</span>
              <h3>{phase.horizon}</h3>
              <p>{phase.body}</p>
              <ul className="timeline-card__list">
                {phase.deliverables.map((deliverable) => (
                  <li key={deliverable}>{deliverable}</li>
                ))}
              </ul>
              <strong>{phase.note}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial-section editorial-section--quote">
        <div className="quote-panel" data-reveal>
          <span className="quote-panel__kicker">Governance</span>
          <p className="quote-panel__text">
            No feature deserves a glossy reveal if the transport still cannot hold its
            nerve.
          </p>
        </div>
      </section>

      <section className="editorial-section">
        <SectionIntro
          kicker="Operating principles"
          title={
            <>
              La direccion del producto se protege
              <br />
              con reglas simples y duras.
            </>
          }
          description="Estas reglas vienen del roadmap y de los release gates del proyecto. Son parte del producto, no notas internas."
        />

        <div className="principle-list" data-stagger>
          {roadmapPrinciples.map((principle) => (
            <article className="principle-card" key={principle} data-stagger-item>
              <span className="principle-card__index">/</span>
              <p>{principle}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
