import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { buildSafeDawfiDesktopCallbackFromSearch } from '../lib/oauthConsent';
import './Auth.css';

type BridgeStatus = 'invalid' | 'ready' | 'opening';

export function DesktopAuthBridge() {
  const callbackUrl = useMemo(() => (
    window.location.hash
      ? null
      : buildSafeDawfiDesktopCallbackFromSearch(window.location.search)
  ), []);
  const [status, setStatus] = useState<BridgeStatus>(callbackUrl ? 'ready' : 'invalid');
  const didOpenRef = useRef(false);

  useLayoutEffect(() => {
    if (window.location.search || window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!callbackUrl || didOpenRef.current) return;
    didOpenRef.current = true;
    setStatus('opening');

    try {
      window.location.assign(callbackUrl);
    } catch {
      setStatus('ready');
    }
  }, [callbackUrl]);

  const openDesktop = () => {
    if (!callbackUrl) return;
    setStatus('opening');
    try {
      window.location.assign(callbackUrl);
    } catch {
      setStatus('ready');
    }
  };

  const isInvalid = status === 'invalid';

  return (
    <div className="auth-page">
      <main className="auth-card" aria-live="polite">
        <div className="auth-card__glitch-bar" />
        <div className="auth-card__header">
          <img src="/logo-sphere.svg" alt="DAW-fi" className="auth-card__logo" />
          <h1 className="auth-card__title">
            {isInvalid ? 'No se pudo vincular DAW-fi' : 'Confirma la apertura de DAW-fi'}
          </h1>
          <p className="auth-card__subtitle">
            {isInvalid
              ? 'La respuesta de autenticación está incompleta o ya no es válida.'
              : 'El navegador intentará volver a la aplicación de escritorio.'}
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
            <h2 className="auth-success__title">
              {status === 'opening' ? 'Comprueba la aplicación' : 'Abre DAW-fi para continuar'}
            </h2>
            <p className="auth-success__desc">
              Solicitamos al navegador abrir DAW-fi con un código temporal protegido por PKCE.
              Esta página no puede confirmar por sí sola que la aplicación ya lo recibió.
            </p>
            <p className="desktop-auth-bridge__note">
              Cuando DAW-fi esté visible y muestre tu cuenta, vuelve al programa y entonces puedes cerrar esta pestaña manualmente.
            </p>
            <div className="desktop-auth-bridge__actions">
              <button type="button" className="auth-form__submit" onClick={openDesktop}>
                <ExternalLink size={16} aria-hidden="true" /> Reintentar abrir DAW-fi
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
