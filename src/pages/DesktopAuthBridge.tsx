import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { logService } from '../daw/services/logService';
import './Auth.css';

type BridgeStatus = 'checking' | 'ready' | 'redirecting' | 'error';

const DEFAULT_RETURN_TO = 'hollowbits://auth/callback';

function getSafeReturnTo(rawReturnTo: string | null): string {
  if (!rawReturnTo) return DEFAULT_RETURN_TO;

  try {
    const parsed = new URL(rawReturnTo);
    if (parsed.protocol === 'hollowbits:') return parsed.toString();
  } catch {
    // Ignore malformed return targets.
  }

  return DEFAULT_RETURN_TO;
}

function buildCurrentBridgeUrl(returnTo: string, state: string, prompt: string): string {
  const url = new URL('/desktop-auth', window.location.origin);
  url.searchParams.set('source', 'desktop');
  url.searchParams.set('return_to', returnTo);
  if (state) url.searchParams.set('state', state);
  if (prompt) url.searchParams.set('prompt', prompt);
  return url.toString();
}

export function DesktopAuthBridge() {
  const session = useAuthStore((store) => store.session);
  const isLoading = useAuthStore((store) => store.isLoading);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const returnTo = useMemo(() => getSafeReturnTo(params.get('return_to')), [params]);
  const state = params.get('state') || '';
  const prompt = params.get('prompt') === 'none' ? 'none' : 'select_account';
  const [status, setStatus] = useState<BridgeStatus>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [handoffUrl, setHandoffUrl] = useState<string | null>(null);

  const createHandoffUrl = useCallback((accessToken: string, refreshToken: string): string => {
    const callbackUrl = new URL(returnTo);
    const hash = new URLSearchParams(callbackUrl.hash.startsWith('#') ? callbackUrl.hash.slice(1) : callbackUrl.hash);
    hash.set('access_token', accessToken);
    hash.set('refresh_token', refreshToken);
    hash.set('type', 'desktop_handoff');
    if (state) hash.set('desktop_state', state);
    callbackUrl.hash = hash.toString();
    return callbackUrl.toString();
  }, [returnTo, state]);

  const handoffSession = useCallback(async () => {
    setStatus('checking');
    setErrorMessage(null);

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      logService.error('Failed to get session during handoff', 'DesktopAuthBridge', error);
      setStatus('error');
      setErrorMessage(error.message);
      return;
    }

    const activeSession = data.session || session;
    if (!activeSession?.access_token || !activeSession.refresh_token) {
      logService.info('No active session found, waiting for user login', 'DesktopAuthBridge');
      setStatus('ready');
      return;
    }

    const nextHandoffUrl = createHandoffUrl(activeSession.access_token, activeSession.refresh_token);
    logService.info('Session found, redirecting to desktop app', 'DesktopAuthBridge', { returnTo });
    setHandoffUrl(nextHandoffUrl);
    setStatus('redirecting');
    window.location.assign(nextHandoffUrl);
  }, [createHandoffUrl, session]);

  useEffect(() => {
    if (!isLoading) {
      void handoffSession();
    }
  }, [handoffSession, isLoading]);

  const handleGoogleLogin = async () => {
    setStatus('checking');
    setErrorMessage(null);
    logService.info('Initiating Google OAuth for desktop bridge', 'DesktopAuthBridge');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: buildCurrentBridgeUrl(returnTo, state, prompt),
        queryParams: { prompt },
      },
    });

    if (error) {
      logService.error('Google OAuth failed for desktop bridge', 'DesktopAuthBridge', error);
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__glitch-bar" />
        <div className="auth-card__header">
          <img src="/logo-sphere.svg" alt="HOLLOW bits" className="auth-card__logo" />
          <h1 className="auth-card__title">Conectar Desktop</h1>
          <p className="auth-card__subtitle">Sincronizando tu sesion web con Hollow Bits Desktop.</p>
        </div>

        {status === 'error' && errorMessage && (
          <div className="auth-form__error">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {status === 'ready' && (
          <button type="button" className="auth-google-btn" onClick={handleGoogleLogin}>
            Continuar con Google
            <ArrowRight size={16} />
          </button>
        )}

        {status !== 'ready' && (
          <div className="auth-success">
            <p className="auth-success__desc">
              {status === 'redirecting' ? 'Abriendo Hollow Bits Desktop...' : 'Verificando sesion activa...'}
            </p>
          </div>
        )}

        {handoffUrl && (
          <div className="auth-card__footer">
            <p>
              <a href={handoffUrl}>Abrir Hollow Bits Desktop</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
