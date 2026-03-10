import { ecosystemAtlas, ecosystemScenes } from '../content';
import { LinkPill, PosterCard, SectionIntro } from '../components/Editorial';
import { usePageMotion } from '../components/usePageMotion';

export function Ecosystem() {
  const pageRef = usePageMotion();

  return (
    <div className="page-shell" ref={pageRef}>
      <section className="page-hero page-hero--split" data-page-hero>
        <div>
          <span className="eyebrow-tag">Studio scenes - HB-02</span>
          <h1 className="page-hero__title">
            El flujo debe sentirse
            <br />
            mas fisico que burocratico.
          </h1>
          <p className="page-hero__body">
            Session, arrange, browser, automation, export y direccion AI no se venden
            aqui como una hoja de specs. Se muestran como escenas de estudio que hacen
            que la herramienta respire.
          </p>
        </div>

        <div className="page-hero__aside">
          <span className="page-hero__aside-kicker">Current posture</span>
          <p>
            La app ya enseña browser con preview, virtualizacion para sesiones grandes,
            comping, export y capas de colaboracion en formacion.
          </p>
          <LinkPill to="/roadmap" quiet>
            Ver siguiente fase
          </LinkPill>
        </div>
      </section>

      <section className="editorial-section">
        <SectionIntro
          kicker="Four working states"
          title={
            <>
              Cada superficie cuenta una parte
              <br />
              distinta del mismo estudio.
            </>
          }
          description="La direccion visual multipagina funciona porque cada escena tiene otra temperatura: vivo, memoria, importacion y futuro."
        />

        <div className="scene-stack">
          {ecosystemScenes.map((scene, index) => (
            <article
              className={`scene-block ${index % 2 === 1 ? 'scene-block--reverse' : ''}`}
              key={scene.title}
            >
              <div className="scene-block__visual" data-parallax={String(index % 2 === 0 ? 100 : 70)}>
                <PosterCard item={scene.poster} />
              </div>

              <div className="scene-block__copy" data-reveal>
                <span className="scene-block__eyebrow">{scene.eyebrow}</span>
                <h3>{scene.title}</h3>
                <p>{scene.body}</p>
                <ul className="scene-block__list">
                  {scene.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial-section">
        <SectionIntro
          kicker="Atlas"
          title={
            <>
              La escala real del producto
              <br />
              aparece en los detalles.
            </>
          }
          description="Virtualizacion, rutas de audio, import pipeline y export parity son piezas menos glamorosas, pero sostienen la sensacion de estudio serio."
        />

        <div className="atlas-grid" data-stagger>
          {ecosystemAtlas.map((item) => (
            <article className="atlas-card" key={item.title} data-stagger-item>
              <span className="atlas-card__stat">{item.stat}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
