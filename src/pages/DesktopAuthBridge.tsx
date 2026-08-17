import { AlertCircle, ShieldCheck } from 'lucide-react';
import './Auth.css';

/**
 * Desktop authentication remains deliberately fail-closed until a server-side
 * broker can issue short-lived, one-time authorization codes. Web sessions
 * must never be copied into custom-protocol URLs or rendered into the DOM.
 */
export function DesktopAuthBridge() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__glitch-bar" />
        <div className="auth-card__header">
          <img src="/logo-sphere.svg" alt="DAW-fi" className="auth-card__logo" />
          <h1 className="auth-card__title">Conexión desktop en pausa</h1>
          <p className="auth-card__subtitle">
            El enlace seguro con DAW-fi Desktop todavía requiere un broker de código único.
          </p>
        </div>

        <div className="auth-form__error">
          <AlertCircle size={16} />
          <span>
            Por seguridad, DAW-fi no transfiere credenciales de sesión mediante URLs o enlaces profundos.
          </span>
        </div>

        <div className="auth-success">
          <ShieldCheck size={22} aria-hidden="true" />
          <p className="auth-success__desc">
            Puedes continuar usando DAW-fi Web y el modo local de Desktop. La vinculación se habilitará
            cuando el intercambio use un código de un solo uso, con estado verificado y expiración corta.
          </p>
        </div>
      </div>
    </div>
  );
}
