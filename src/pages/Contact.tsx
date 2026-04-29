import { Btn, SectionHeader } from '../components/Editorial';
import { usePageMotion } from '../components/usePageMotion';

const reasons = [
  { tag: 'Productores', title: 'Para artistas que ya saben qué odian de esperar.', body: 'Si tu idea siempre llega antes que tu DAW, este acceso temprano está pensado para ti.' },
  { tag: 'Sound Designers', title: 'Para estudios que necesitan profundidad sin ruido.', body: 'Routing, diagnósticos y una narrativa de precisión para quienes viven dentro del detalle.' },
  { tag: 'Live Performers', title: 'Para performers que no pueden permitirse un set frágil.', body: 'La promesa principal no es solo sonar bonito. Es mantenerse de pie cuando el show ya empezó.' },
];

export function Contact() {
  const pageRef = usePageMotion();

  return (
    <div className="page-shell" ref={pageRef}>
      <section className="hero" style={{ minHeight: 'auto', paddingBottom: '2rem' }} data-page-hero>
        <div className="hero__badge"><span className="hero__badge-dot" /> Contacto</div>
        <h1 className="hero__title" style={{ fontSize: 'clamp(2.8rem,6vw,5rem)' }}>
          Acceso temprano<br />para quienes sienten el hueco.
        </h1>
        <p className="hero__subtitle">
          HOLLOW BITS todavía está tomando forma. Eso es precisamente lo que vuelve
          valioso entrar ahora.
        </p>
      </section>

      <section className="section">
        <div className="contact-grid">
          <div>
            <SectionHeader
              kicker="¿Para quién?"
              title={<>Early access no significa<br />pedir fe ciega.</>}
              description="Significa abrir una conversación con personas que reconocen el problema."
            />
            <div style={{ display: 'grid', gap: '1rem' }} data-stagger>
              {reasons.map(r => (
                <article className="glass-card" key={r.title} data-stagger-item>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.68rem', letterSpacing: '.16em', textTransform: 'uppercase' as const, color: 'var(--accent-lilac)' }}>{r.tag}</span>
                  <h3 className="glass-card__title" style={{ marginTop: '.5rem' }}>{r.title}</h3>
                  <p className="glass-card__text">{r.body}</p>
                </article>
              ))}
            </div>
          </div>

          <form className="contact-form" onSubmit={e => e.preventDefault()} data-reveal>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.68rem', letterSpacing: '.16em', textTransform: 'uppercase' as const, color: 'var(--text-muted)' }}>
                Formulario de acceso
              </span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginTop: '.5rem' }}>
                Entra antes de que las paredes sequen.
              </h2>
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
              <select name="workflow" defaultValue="Ableton Live">
                {['Ableton Live','Logic Pro','Pro Tools','FL Studio','Reaper','Otro'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>¿Qué parte de tu flujo ya no soportas?</span>
              <textarea name="pain" rows={4} placeholder="Latencia, menús, fragilidad en vivo, export dudoso..." />
            </label>
            <button className="contact-form__submit" type="submit">Solicitar acceso</button>
          </form>
        </div>
      </section>
    </div>
  );
}
