import { Btn } from '../components/Editorial';
import { usePageMotion } from '../components/usePageMotion';
import { Link } from 'react-router-dom';

function DAWPreview() {
  return (
    <div className="daw-preview" data-reveal>
      <div className="daw-preview__image-wrapper">
        <img
          src="/daw-screenshot-real.png"
          alt="Interfaz de DAW-fi Studio"
          className="daw-preview__image"
          onError={(e) => {
            e.currentTarget.hidden = true;
            e.currentTarget.parentElement?.classList.add('daw-preview__image-wrapper--fallback');
          }}
        />
      </div>
    </div>
  );
}

export function Home() {
  const pageRef = usePageMotion();

  return (
    <div className="page-shell" ref={pageRef}>
      <section className="hero hero--home" data-page-hero>
        <div className="hero__copy">
          <span className="hero__eyebrow">DAW-fi · Workspace musical</span>
          <h1 className="hero__title">
            Tu música.<br />Un espacio claro.<br /><span>Sin interrupciones.</span>
          </h1>
          <p className="hero__subtitle">
            Produce, edita, escribe partituras y practica con visualización de notas.
            DAW-fi mantiene el mismo proyecto en escritorio y navegador.
          </p>
          <div className="hero__actions">
            <Btn to="/console">Abrir el Hub</Btn>
            <Btn to="/features" variant="ghost">Ver funciones</Btn>
          </div>
          <p className="hero__note">Local-first · Importación de audio · Transporte unificado</p>
        </div>
        <DAWPreview />
      </section>

      <section className="product-strip" aria-labelledby="product-strip-title">
        <div className="product-strip__intro" data-reveal>
          <span className="section__kicker">Un proyecto, tres superficies</span>
          <h2 id="product-strip-title">Entra directamente a la herramienta que necesitas.</h2>
        </div>
        <div className="product-strip__grid" data-stagger>
          <Link to="/engine" className="product-strip__card" data-stagger-item>
            <span>01</span><h3>DAW-fi Studio</h3><p>Producción, arreglo, mezcla e importación de audio.</p>
          </Link>
          <Link to="/score" className="product-strip__card" data-stagger-item>
            <span>02</span><h3>Score-fi</h3><p>Notación musical independiente y sincronizada.</p>
          </Link>
          <Link to="/keys" className="product-strip__card" data-stagger-item>
            <span>03</span><h3>Keys-fi</h3><p>Práctica visual de notas ligada al transporte real.</p>
          </Link>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-section__inner" data-reveal>
          <h2 className="cta-section__title">
            Abre tu estudio.<br />Continúa donde lo dejaste.
          </h2>
          <p className="cta-section__desc">
            Un acceso para el Hub, DAW-fi Studio, Score-fi y Keys-fi en escritorio y web.
          </p>
          <div className="hero__actions">
            <Btn to="/console">Entrar al Hub</Btn>
            <Btn to="/features" variant="ghost">Explorar DAW-fi</Btn>
          </div>
        </div>
      </section>
    </div>
  );
}
