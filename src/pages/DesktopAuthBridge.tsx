import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { buildSafeDawfiDesktopCallbackFromSearch } from '../lib/oauthConsent';
import './Auth.css';

type BridgeStatus = 'invalid' | 'opening' | 'delivered';

export function DesktopAuthBridge() {
  const callbackUrl = useMemo(() => (
    window.location.hash
      ? null
      : buildSafeDawfiDesktopCallbackFromSearch(window.location.search)
  ), []);
  const [status, setStatus] = useState<BridgeStatus>(callbackUrl ? 'opening' : 'invalid');
  const [closeAttempted, setCloseAttempted] = useState(false);
  const didOpenRef = useRef(false);

  useLayoutEffect(() => {
    if (window.location.search || window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!callbackUrl || didOpenRef.current) return;
    didOpenRef.current = true;
    setStatus('delivered');

    try {
      window.location.assign(callbackUrl);
    } catch {
      // The visible fallback button remains available when a browser blocks
      // automatic custom-protocol navigation.
    }

    const closeTimer = window.setTimeout(() => {
      setCloseAttempted(true);
      window.close();
    }, 2200);
    return () => window.clearTimeout(closeTimer);
  }, [callbackUrl]);

  const openDesktop = () => {
    if (!callbackUrl) return;
    window.location.assign(callbackUrl);
  };

  const closeTab = () => {
    setCloseAttempted(true);
    window.close();
  };

  const isInvalid = status === 'invalid';

  return (
    <div className="auth-page">
      <main className="auth-card" aria-live="polite">
        <div className="auth-card__glitch-bar" />
        <div className="auth-card__header">
          <img src="/logo-sphere.svg" alt="DAW-fi" className="auth-card__logo" />
          <h1 className="auth-card__title">
            {isInvalid ? 'No se pudo vincular DAW-fi' : 'Sesión enviada a DAW-fi'}
          </h1>
          <p className="auth-card__subtitle">
            {isInvalid
              ? 'La respuesta de autenticación está incompleta o ya no es válida.'
              : status === 'opening'
                ? 'Abriendo la aplicación de escritorio…'
                : 'Vuelve a la aplicación para continuar con tu cuenta.'}
          </p>
        </div>

        {isInvalid ? (
          <div className="auth-form__error">
            <AlertCircle size={16} />
            <span>Regresa a DAW-fi e inicia nuevamente el acceso con Google.</span>
          </div>
        ) : (
          <div className="auth-success">
            <ShieldCheck className="auth-success__icon" size={28} aria-hidden="true" />
            <h2 className="auth-success__title">Esta pestaña ya no es necesaria</h2>
            <p className="auth-success__desc">
              Puedes cerrarla con seguridad. DAW-fi solo recibió un código temporal protegido por PKCE;
              tu sesión no se mostró ni se copió en esta página.
            </p>
            {closeAttempted && (
              <p className="desktop-auth-bridge__note">
                Si el navegador no permite cerrarla automáticamente, usa el botón Cerrar pestaña o ciérrala manualmente.
              </p>
            )}
            <div className="desktop-auth-bridge__actions">
              <button type="button" className="auth-form__submit" onClick={openDesktop}>
                <ExternalLink size={16} aria-hidden="true" /> Abrir DAW-fi
              </button>
              <button type="button" className="auth-form__submit auth-form__submit--ghost" onClick={closeTab}>
                <X size={16} aria-hidden="true" /> Cerrar pestaña
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
