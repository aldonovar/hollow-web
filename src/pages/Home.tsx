import { Link } from 'react-router-dom';

import {
  homeComparisons,
  homeHeroMetrics,
  homePosters,
  manifestoMetrics,
  routePreviewPosters,
} from '../content';
import { LinkPill, MetricCard, PosterCard, SectionIntro } from '../components/Editorial';
import { usePageMotion } from '../components/usePageMotion';

export function Home() {
  const pageRef = usePageMotion();

  return (
    <div className="page-shell page-shell--home" ref={pageRef}>
      <section className="hero-landing" data-page-hero>
        <div className="hero-landing__copy">
          <span className="eyebrow-tag">DAW manifesto - Windows x64 - private build</span>
          <h1 className="hero-landing__title">
            El estudio no deberia sentirse
            <br />
            mas pequeno que tu idea.
          </h1>
          <p className="hero-landing__body">
            HOLLOW BITS mezcla impulso performativo, profundidad tecnica y un lenguaje
            visual mas cinematografico para quienes ya no quieren elegir entre velocidad
            y control.
          </p>
          <div className="hero-landing__actions">
            <LinkPill to="/engine">Ver capa de prueba</LinkPill>
            <LinkPill to="/contact" quiet>
              Entrar al early circle
            </LinkPill>
          </div>
        </div>

        <div className="hero-landing__collage" data-parallax="120">
          <PosterCard item={homePosters[0]} className="hero-poster hero-poster--primary" />
          <PosterCard item={homePosters[1]} className="hero-poster hero-poster--secondary" />
          <PosterCard item={homePosters[2]} className="hero-poster hero-poster--tertiary" />
        </div>
      </section>

      <section className="editorial-section editorial-section--flush">
        <div className="metric-strip" data-stagger>
          {homeHeroMetrics.map((item) => (
            <div key={item.label} data-stagger-item>
              <MetricCard item={item} />
            </div>
          ))}
        </div>
      </section>

      <section className="editorial-section">
        <SectionIntro
          kicker="Why this exists"
          title={
            <>
              Ableton nos dio velocidad.
              <br />
              Logic nos dio pulido.
              <br />
              HOLLOW BITS quiere el espacio despues de ambos.
            </>
          }
          description="No se trata de insultar a los DAWs que formaron una generacion. Se trata de aceptar que todavia hay un territorio nuevo entre performance, precision y presencia visual."
        />

        <div className="comparison-grid" data-stagger>
          {homeComparisons.map((item) => (
            <article className="comparison-card" key={item.title} data-stagger-item>
              <span className="comparison-card__eyebrow">{item.eyebrow}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <strong>{item.detail}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial-section editorial-section--quote">
        <div className="quote-panel" data-reveal>
          <span className="quote-panel__kicker">Core feeling</span>
          <p className="quote-panel__text">
            This is not a prettier dashboard for old habits.
            <br />
            It is a studio language built around pulse, scale and intent.
          </p>
          <span className="quote-panel__caption">
            Silent by default. Visceral by design.
          </span>
        </div>
      </section>

      <section className="editorial-section">
        <SectionIntro
          kicker="Product evidence"
          title={
            <>
              El manifiesto no flota solo.
              <br />
              Ya tiene columna tecnica debajo.
            </>
          }
          description="Estos bloques salen de la app madre y de su documentacion: reliability matrix, benchmark export, virtualizacion de sesiones y una disciplina de release que impide vender humo."
        />

        <div className="metric-grid metric-grid--three" data-stagger>
          {manifestoMetrics.map((item) => (
            <div key={item.label} data-stagger-item>
              <MetricCard item={item} />
            </div>
          ))}
        </div>
      </section>

      <section className="editorial-section">
        <SectionIntro
          kicker="Continue the trip"
          title={
            <>
              Explora el proyecto como una serie
              <br />
              de capitulos, no como tabs sueltas.
            </>
          }
          description="Cada pagina empuja una parte distinta del relato: prueba, flujo, futuro y acceso."
        />

        <div className="route-preview-grid" data-stagger>
          {routePreviewPosters.map((poster, index) => {
            const routes = ['/engine', '/ecosystem', '/contact'];
            return (
              <Link
                className="route-preview-link"
                key={poster.title}
                to={routes[index]}
                data-stagger-item
              >
                <PosterCard item={poster} />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
