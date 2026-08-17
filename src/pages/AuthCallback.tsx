import { useEffect, useRef, useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  AUTH_CALLBACK_PATH,
  beginGoogleSignIn,
  getAuthErrorMessage,
  readAuthNextFromSearch,
} from '../lib/authFlow';
import { useAuthStore } from '../stores/authStore';
import './Auth.css';

type CallbackStatus = 'processing' | 'error';

function readCallbackError(search: URLSearchParams, hash: URLSearchParams): string | null {
  const errorCode = search.get('error_code') || search.get('error') || hash.get('error_code') || hash.get('error');
  const description = search.get('error_description') || hash.get('error_description');

  if (!errorCode && !description) return null;
  if (errorCode === 'access_denied') return 'El inicio de sesión fue cancelado.';
  return description || 'Google no pudo completar el inicio de sesión.';
}

export function AuthCallback() {
  const navigate = useNavigate();
  const exchangeStarted = useRef(false);
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nextPath = readAuthNextFromSearch(window.location.search);

  useEffect(() => {
    if (exchangeStarted.current) return;
    exchangeStarted.current = true;

    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '');
    const callbackError = readCallbackError(search, hash);
    const authCode = search.get('code');
    const cleanUrl = new URL(AUTH_CALLBACK_PATH, window.location.origin);
    cleanUrl.searchParams.set('next', nextPath);
    window.history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}`);

    if (callbackError) {
      setStatus('error');
      setErrorMessage(callbackError);
      return;
    }

    if (!authCode) {
      setStatus('error');
      setErrorMessage('El callback de autenticación no incluyó un código válido.');
      return;
    }

    void supabase.auth.exchangeCodeForSession(authCode)
      .then(({ data, error }) => {
        if (error || !data.session) {
          throw error || new Error('No se pudo establecer una sesión válida.');
        }

        useAuthStore.setState({
          user: data.session.user,
          session: data.session,
          isLoading: false,
        });
        navigate(nextPath, { replace: true });
      })
      .catch((error: unknown) => {
        setStatus('error');
        setErrorMessage(getAuthErrorMessage(error));
      });
  }, [navigate, nextPath]);

  const retry = async () => {
    setStatus('processing');
    setErrorMessage(null);
    try {
      await beginGoogleSignIn(nextPath);
    } catch (error) {
      setStatus('error');
      setErrorMessage(getAuthErrorMessage(error));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__glitch-bar" />
        <div className="auth-card__header">
          <img src="/logo-sphere.svg" alt="DAW-fi" className="auth-card__logo" />
          <h1 className="auth-card__title">
            {status === 'processing' ? 'Verificando sesión' : 'No se pudo iniciar sesión'}
          </h1>
          <p className="auth-card__subtitle">
            {status === 'processing'
              ? 'Completando el acceso seguro con Google...'
              : 'La sesión no fue creada. Puedes reiniciar el flujo de forma segura.'}
          </p>
        </div>

        {status === 'processing' ? (
          <div className="auth-success">
            <p className="auth-success__desc">Procesando callback PKCE...</p>
          </div>
        ) : (
          <>
            <div className="auth-form__error">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
            <button type="button" className="auth-google-btn" onClick={() => void retry()}>
              <RotateCcw size={16} />
              Reintentar con Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
