import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  LockKeyhole,
  MonitorSmartphone,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import {
  buildOAuthConsentLoginPath,
  getSafeDawfiDesktopRedirectUrl,
  isDawfiDesktopRedirectUri,
  readOAuthAuthorizationId,
} from '../lib/oauthConsent';
import './Auth.css';

type AuthorizationResponse = NonNullable<
  Awaited<ReturnType<typeof supabase.auth.oauth.getAuthorizationDetails>>['data']
>;
type AuthorizationDetails = Extract<AuthorizationResponse, { authorization_id: string }>;
type ConsentStatus = 'loading' | 'ready' | 'approving' | 'denying' | 'error';
type ConsentDecision = 'approve' | 'deny';

const SCOPE_LABELS: Record<string, string> = {
  openid: 'Confirmar tu identidad de DAW-fi',
  email: 'Consultar el correo asociado a tu cuenta',
  profile: 'Consultar tu nombre y perfil público',
};

function describeScopes(scope: string): Array<{ id: string; label: string }> {
  return [...new Set(scope.split(/\s+/).map((item) => item.trim()).filter(Boolean))]
    .map((id) => ({ id, label: SCOPE_LABELS[id] ?? `Permiso solicitado: ${id}` }));
}

export function OAuthConsent() {
  const location = useLocation();
  const navigate = useNavigate();
  const authorizationId = useMemo(
    () => (location.hash ? null : readOAuthAuthorizationId(location.search)),
    [location.hash, location.search],
  );
  const [status, setStatus] = useState<ConsentStatus>('loading');
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const decisionInFlight = useRef(false);

  useEffect(() => {
    if (!location.hash) return;
    window.history.replaceState(null, '', `${location.pathname}${location.search}`);
  }, [location.hash, location.pathname, location.search]);

  const redirectToDesktop = useCallback((redirectUrl: string, expectedRedirectUri?: string) => {
    const safeRedirect = getSafeDawfiDesktopRedirectUrl(redirectUrl, expectedRedirectUri);
    if (!safeRedirect) {
      throw new Error('Supabase returned an unexpected OAuth redirect.');
    }

    window.location.assign(safeRedirect);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAuthorization() {
      setDetails(null);
      setErrorMessage(null);
      setStatus('loading');

      if (!authorizationId) {
        setStatus('error');
        setErrorMessage('La solicitud de conexión no contiene un identificador válido.');
        return;
      }

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (!active) return;

        if (sessionError) {
          throw new Error('The browser session could not be read.');
        }

        if (!sessionData.session) {
          navigate(buildOAuthConsentLoginPath(authorizationId), { replace: true });
          return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!active) return;

        if (userError || !userData.user) {
          throw new Error('The browser session could not be verified.');
        }

        const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
        if (!active) return;

        if (error || !data) {
          throw new Error('The authorization request could not be verified.');
        }

        if (!('authorization_id' in data)) {
          redirectToDesktop(data.redirect_url);
          return;
        }

        if (
          data.authorization_id !== authorizationId
          || !isDawfiDesktopRedirectUri(data.redirect_uri)
          || !data.client.id
          || !data.client.name.trim()
        ) {
          throw new Error('The authorization request does not belong to DAW-fi Desktop.');
        }

        setDetails(data);
        setStatus('ready');
      } catch {
        if (!active) return;
        setStatus('error');
        setErrorMessage(
          'No pudimos verificar esta conexión con DAW-fi Desktop. La solicitud puede haber expirado.',
        );
      }
    }

    void loadAuthorization();
    return () => {
      active = false;
    };
  }, [authorizationId, navigate, redirectToDesktop, reloadToken]);

  const handleDecision = useCallback(async (decision: ConsentDecision) => {
    if (!authorizationId || decisionInFlight.current) return;

    decisionInFlight.current = true;
    setErrorMessage(null);
    setStatus(decision === 'approve' ? 'approving' : 'denying');

    try {
      const response = decision === 'approve'
        ? await supabase.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
        : await supabase.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true });

      if (response.error || !response.data?.redirect_url) {
        throw new Error('Supabase could not complete the authorization decision.');
      }

      redirectToDesktop(
        response.data.redirect_url,
        details?.redirect_uri,
      );
    } catch {
      setStatus('error');
      setErrorMessage(
        decision === 'approve'
          ? 'No se pudo autorizar DAW-fi Desktop. Intenta nuevamente con una solicitud vigente.'
          : 'No se pudo cancelar la solicitud de forma segura. Puedes reintentar o cerrar esta pestaña.',
      );
    } finally {
      decisionInFlight.current = false;
    }
  }, [authorizationId, details?.redirect_uri, redirectToDesktop]);

  const scopes = details ? describeScopes(details.scope) : [];
  const isBusy = status === 'loading' || status === 'approving' || status === 'denying';

  return (
    <div className="auth-page oauth-consent-page">
      <main className="auth-card oauth-consent-card" aria-busy={isBusy}>
        <div className="auth-card__glitch-bar" />
        <header className="auth-card__header">
          <img src="/logo-sphere.svg" alt="DAW-fi" className="auth-card__logo" />
          <p className="oauth-consent__eyebrow">Conexión cifrada · OAuth 2.1</p>
          <h1 className="auth-card__title">
            {status === 'ready'
              ? 'Conectar DAW-fi Desktop'
              : status === 'error'
                ? 'No se pudo verificar'
                : 'Verificando conexión'}
          </h1>
          <p className="auth-card__subtitle">
            {status === 'error'
              ? 'La conexión se detuvo antes de transferir información al programa.'
              : 'Autoriza el programa de escritorio sin transferir credenciales mediante enlaces.'}
          </p>
        </header>

        {status === 'loading' && (
          <section className="oauth-consent__status" role="status" aria-live="polite">
            <span className="oauth-consent__spinner" aria-hidden="true" />
            <strong>Validando solicitud</strong>
            <span>Confirmando tu sesión y la identidad del programa solicitante...</span>
          </section>
        )}

        {(status === 'approving' || status === 'denying') && (
          <section className="oauth-consent__status" role="status" aria-live="polite">
            <span className="oauth-consent__spinner" aria-hidden="true" />
            <strong>{status === 'approving' ? 'Autorizando acceso' : 'Cancelando solicitud'}</strong>
            <span>Espera mientras Supabase genera una respuesta de un solo uso...</span>
          </section>
        )}

        {status === 'ready' && details && (
          <>
            <section className="oauth-consent__client" aria-label="Programa solicitante">
              <span className="oauth-consent__client-icon" aria-hidden="true">
                <MonitorSmartphone size={24} />
              </span>
              <div>
                <span>Programa solicitante</span>
                <strong>{details.client.name}</strong>
                <code>{details.redirect_uri}</code>
              </div>
            </section>

            <section className="oauth-consent__permissions" aria-labelledby="oauth-permissions-title">
              <h2 id="oauth-permissions-title">Permisos solicitados</h2>
              {scopes.length > 0 ? (
                <ul>
                  {scopes.map((scope) => (
                    <li key={scope.id}>
                      <Check size={16} aria-hidden="true" />
                      <span>{scope.label}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No se solicitaron permisos adicionales.</p>
              )}
            </section>

            <div className="oauth-consent__security-note">
              <ShieldCheck size={19} aria-hidden="true" />
              <span>
                El navegador devolverá únicamente un código temporal. Tu sesión no se incluirá en la URL.
              </span>
            </div>

            <div className="oauth-consent__actions">
              <button
                type="button"
                className="auth-form__submit"
                onClick={() => void handleDecision('approve')}
                disabled={isBusy}
              >
                <LockKeyhole size={17} aria-hidden="true" />
                Autorizar Desktop
              </button>
              <button
                type="button"
                className="auth-form__submit auth-form__submit--ghost"
                onClick={() => void handleDecision('deny')}
                disabled={isBusy}
              >
                <X size={17} aria-hidden="true" />
                Cancelar acceso
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="auth-form__error" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{errorMessage ?? 'La solicitud no pudo completarse.'}</span>
            </div>
            <div className="oauth-consent__actions">
              <button
                type="button"
                className="auth-form__submit"
                onClick={() => setReloadToken((value) => value + 1)}
                disabled={isBusy || !authorizationId}
              >
                <RotateCcw size={17} aria-hidden="true" />
                Reintentar
              </button>
              {authorizationId ? (
                <button
                  type="button"
                  className="auth-form__submit auth-form__submit--ghost"
                  onClick={() => void handleDecision('deny')}
                  disabled={isBusy}
                >
                  <X size={17} aria-hidden="true" />
                  Cancelar solicitud
                </button>
              ) : (
                <button
                  type="button"
                  className="auth-form__submit auth-form__submit--ghost"
                  onClick={() => navigate('/console', { replace: true })}
                >
                  Volver a DAW-fi
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
