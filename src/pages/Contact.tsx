import { accessOptions, accessReasons } from '../content';
import { LinkPill, SectionIntro } from '../components/Editorial';
import { usePageMotion } from '../components/usePageMotion';

export function Contact() {
  const pageRef = usePageMotion();

  return (
    <div className="page-shell" ref={pageRef}>
      <section className="page-hero page-hero--split" data-page-hero>
        <div>
          <span className="eyebrow-tag">Private circle - HB-04</span>
          <h1 className="page-hero__title">
            Acceso temprano
            <br />
            para quienes sienten el hueco.
          </h1>
          <p className="page-hero__body">
            HOLLOW BITS todavia esta tomando forma. Eso es precisamente lo que vuelve
            valioso entrar ahora: puedes probar una direccion distinta antes de que el
            release la vuelva costumbre.
          </p>
        </div>

        <div className="page-hero__aside">
          <span className="page-hero__aside-kicker">What we want</span>
          <p>
            Productores, estudios, performers y sound designers que quieran una
            alternativa real, no otra demo bonita sin columna tecnica.
          </p>
          <LinkPill to="/engine" quiet>
            Revisar la capa tecnica
          </LinkPill>
        </div>
      </section>

      <section className="editorial-section">
        <div className="contact-grid">
          <div className="contact-grid__info">
            <SectionIntro
              kicker="Who this is for"
              title={
                <>
                  Early access no significa
                  <br />
                  pedir fe ciega.
                </>
              }
              description="Significa abrir una conversacion con personas que reconocen el problema y saben por que vale la pena empujar otra clase de estudio digital."
            />

            <div className="reason-stack" data-stagger>
              {accessReasons.map((reason) => (
                <article className="reason-card" key={reason.title} data-stagger-item>
                  <span className="reason-card__tag">{reason.tag}</span>
                  <h3>{reason.title}</h3>
                  <p>{reason.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="contact-grid__form" data-reveal>
            <form
              className="contact-form"
              onSubmit={(event) => event.preventDefault()}
            >
              <div className="contact-form__intro">
                <span className="contact-form__eyebrow">Application note</span>
                <h2>Enter the room before the walls dry.</h2>
                <p>
                  Dejanos tu estudio, tu contexto y la razon por la que tu DAW actual ya
                  no alcanza.
                </p>
              </div>

              <label className="field">
                <span>Nombre o alias</span>
                <input type="text" name="name" placeholder="Tu firma creativa" required />
              </label>

              <label className="field">
                <span>Correo</span>
                <input type="email" name="email" placeholder="you@studio.com" required />
              </label>

              <label className="field">
                <span>DAW actual</span>
                <select name="workflow" defaultValue={accessOptions[0]}>
                  {accessOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Que parte de tu flujo ya no soportas?</span>
                <textarea
                  name="pain"
                  rows={5}
                  placeholder="Latencia, menus, fragilidad en vivo, export dudoso, saturacion visual..."
                />
              </label>

              <button className="contact-form__submit" type="submit">
                Solicitar private access
              </button>

              <p className="contact-form__note">
                La experiencia web es silenciosa por defecto. El producto no. Nos interesa
                hablar con gente que pueda tensionar la herramienta en contexto real.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
