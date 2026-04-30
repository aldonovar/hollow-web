import { Btn } from '../components/Editorial';
import { usePageMotion } from '../components/usePageMotion';

function DAWPreview() {
  return (
    <div className="daw-preview" data-reveal>
      <div className="daw-preview__image-wrapper">
        <img 
          src="/daw-screenshot-real.png" 
          alt="Hollow Bits DAW Interface" 
          className="daw-preview__image"
          onError={(e) => {
            // Fallback for when the real image isn't uploaded yet
            e.currentTarget.src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=2000';
            e.currentTarget.style.opacity = '0.5';
            e.currentTarget.style.filter = 'grayscale(100%) contrast(1.2)';
          }}
        />
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
          <Btn to="/signup">Comenzar</Btn>
          <Btn to="/features" variant="ghost">Descubrir</Btn>
        </div>
        <DAWPreview />
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
