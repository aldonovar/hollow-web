import {
  engineGateCommands,
  engineNarratives,
  enginePosters,
  engineProofMetrics,
  engineThresholds,
} from '../content';
import { LinkPill, MetricCard, PosterCard, SectionIntro } from '../components/Editorial';
import { usePageMotion } from '../components/usePageMotion';

export function Engine() {
  const pageRef = usePageMotion();

  return (
    <div className="page-shell" ref={pageRef}>
      <section className="page-hero page-hero--split" data-page-hero>
        <div>
          <span className="eyebrow-tag">Proof layer - HB-01</span>
          <h1 className="page-hero__title">
            Prueba tecnica
            <br />
            sin matar el misterio.
          </h1>
          <p className="page-hero__body">
            Detras del tono editorial hay una capa dura: scheduler dual, gates de
            release, budgets de drift y una matrix de confiabilidad pensada para decir
            cuando el producto aun no merece salir.
          </p>
        </div>

        <div className="page-hero__aside">
          <span className="page-hero__aside-kicker">Why it matters</span>
          <p>
            Un benchmark solo sirve cuando tiene poder politico dentro del producto.
            Aqui no es adorno: puede bloquear el release.
          </p>
          <LinkPill to="/contact" quiet>
            Solicitar acceso
          </LinkPill>
        </div>
      </section>

      <section className="editorial-section editorial-section--flush">
        <div className="metric-strip" data-stagger>
          {engineProofMetrics.map((item) => (
            <div key={item.label} data-stagger-item>
              <MetricCard item={item} />
            </div>
          ))}
        </div>
      </section>

      <section className="editorial-section">
        <div className="split-showcase">
          <div className="split-showcase__visual" data-parallax="90">
            <PosterCard item={enginePosters[0]} className="split-showcase__poster" />
            <PosterCard item={enginePosters[1]} className="split-showcase__poster split-showcase__poster--offset" />
          </div>

          <div className="split-showcase__copy">
            <SectionIntro
              kicker="Architecture stance"
              title={
                <>
                  El engine no intenta esconder
                  <br />
                  la dificultad. La coreografia.
                </>
              }
              description="La app madre ya habla en terminos de worklet-clock, interval fallback, graph patching incremental y reportes exportables. Esta pagina traduce esa realidad a una capa visual mas deseable."
            />

            <div className="comparison-stack" data-stagger>
              {engineNarratives.map((item) => (
                <article className="comparison-card comparison-card--wide" key={item.title} data-stagger-item>
                  <span className="comparison-card__eyebrow">{item.eyebrow}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <strong>{item.detail}</strong>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="editorial-section">
        <SectionIntro
          kicker="Gate protocol"
          title={
            <>
              Release discipline
              <br />
              rendered as a visual contract.
            </>
          }
          description="Las reglas del proyecto ya existen en la documentacion: ningun release candidate si un gate falla. Esta seccion lo vuelve legible para quien entra por primera vez."
        />

        <div className="board-grid">
          <article className="board-card" data-reveal>
            <span className="board-card__eyebrow">Always required</span>
            <h3>Engineering gates</h3>
            <ul className="board-card__list">
              {engineGateCommands.map((command) => (
                <li key={command}>{command}</li>
              ))}
            </ul>
          </article>

          <article className="board-card" data-reveal>
            <span className="board-card__eyebrow">Perf budgets</span>
            <h3>Benchmark thresholds</h3>
            <ul className="board-card__list">
              {engineThresholds.map((threshold) => (
                <li key={threshold}>{threshold}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
