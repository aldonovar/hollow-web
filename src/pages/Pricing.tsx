import { pricingTiers } from '../content';
import { Btn, SectionHeader } from '../components/Editorial';
import { usePageMotion } from '../components/usePageMotion';

export function Pricing() {
  const pageRef = usePageMotion();

  return (
    <div className="page-shell" ref={pageRef}>
      <section className="hero" style={{ minHeight: 'auto', paddingBottom: '2rem' }} data-page-hero>
        <div className="hero__badge"><span className="hero__badge-dot" /> Pricing</div>
        <h1 className="hero__title" style={{ fontSize: 'clamp(2.8rem,6vw,5rem)' }}>
          Un plan para<br />cada nivel de ambición.
        </h1>
        <p className="hero__subtitle">
          Empieza gratis. Escala cuando tu proyecto lo necesite. Sin sorpresas, sin letra pequeña.
        </p>
      </section>

      <section className="section">
        <div className="pricing-grid" data-stagger>
          {pricingTiers.map(tier => (
            <article
              className={`pricing-card ${tier.featured ? 'pricing-card--featured' : ''}`}
              key={tier.name}
              data-stagger-item
            >
              <span className="pricing-card__name">{tier.name}</span>
              <div className="pricing-card__price">
                {tier.price}
                {tier.period && <span>{tier.period}</span>}
              </div>
              <p className="pricing-card__desc">{tier.desc}</p>
              <ul className="pricing-card__features">
                {tier.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              <Btn to="/console" variant={tier.featured ? 'primary' : 'ghost'}>
                {tier.cta}
              </Btn>
            </article>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <SectionHeader
          kicker="FAQ"
          title={<>Preguntas frecuentes</>}
        />
        <div className="feature-grid" data-stagger>
          {[
            { q: '¿Puedo usar la versión gratuita sin límite de tiempo?', a: 'Sí. La capa Free no expira. Produce sin presión.' },
            { q: '¿Los proyectos del desktop se sincronizan con la web?', a: 'Totalmente. Cloud sync bidireccional mantiene todo en sincronía.' },
            { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí. Upgrade o downgrade instantáneo. Tus proyectos siempre se mantienen.' },
          ].map(faq => (
            <article className="glass-card" key={faq.q} data-stagger-item>
              <h3 className="glass-card__title" style={{ fontSize: '1.1rem' }}>{faq.q}</h3>
              <p className="glass-card__text">{faq.a}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
