import { usePageMotion } from '../components/usePageMotion';

export function Privacy() {
  const pageRef = usePageMotion();

  return (
    <div className="page-shell" ref={pageRef}>
      <section className="hero" style={{ paddingBottom: '40px' }}>
        <div className="hero__glow hero__glow--purple" />
        <h1 className="hero__title" style={{ fontSize: '3rem' }}>Política de Privacidad</h1>
      </section>

      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem 100px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        <p style={{ marginBottom: '1.5rem' }}>Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
        
        <h2 style={{ color: 'var(--text)', marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem' }}>1. Información que recopilamos</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Recopilamos información básica para el funcionamiento del servicio, incluyendo tu dirección de correo electrónico (a través de nuestro proveedor de autenticación Google/Supabase) e información del perfil público para identificarte dentro del DAW. También almacenamos los proyectos de audio y datos que decides guardar en nuestra nube.
        </p>

        <h2 style={{ color: 'var(--text)', marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem' }}>2. Uso de la información</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Utilizamos tu información exclusivamente para:
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Proporcionar y mantener el servicio de Hollow Bits.</li>
            <li>Autenticar tu cuenta y asegurar tus proyectos.</li>
            <li>Permitir la colaboración segura con otros usuarios.</li>
          </ul>
        </p>

        <h2 style={{ color: 'var(--text)', marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem' }}>3. Compartir información</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          No vendemos ni compartimos tu información personal con terceros para fines comerciales. Tu información de perfil solo es visible para aquellos usuarios con los que decides colaborar y compartir tus proyectos.
        </p>

        <h2 style={{ color: 'var(--text)', marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem' }}>4. Seguridad</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Tus datos están protegidos mediante cifrado estándar de la industria y políticas de seguridad estrictas (Row Level Security) en nuestra base de datos para garantizar que solo usuarios autorizados tengan acceso a tus proyectos.
        </p>

        <h2 style={{ color: 'var(--text)', marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem' }}>5. Contacto</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Si tienes alguna duda sobre esta política, puedes contactarnos en: <strong>steamdusk@gmail.com</strong>
        </p>
      </section>
    </div>
  );
}
