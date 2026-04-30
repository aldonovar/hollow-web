import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Auth.css';

type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

export function Auth({ type }: { type: 'login' | 'signup' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setStatus('error');
      setErrorMessage('Introduce una dirección de correo electrónico válida.');
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/console`,
      },
    });

    if (error) {
      setStatus('error');
      // Map common Supabase error codes to user-friendly messages
      if (error.message.includes('rate limit') || error.status === 429) {
        setErrorMessage('Demasiados intentos. Espera un momento antes de volver a intentarlo.');
      } else if (error.message.includes('invalid') || error.message.includes('Invalid')) {
        setErrorMessage('El correo electrónico proporcionado no es válido.');
      } else {
        setErrorMessage(error.message);
      }
      return;
    }

    setStatus('success');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <img src="/logo-sphere.svg" alt="HOLLOW bits" className="auth-card__logo" />
          <h1 className="auth-card__title">
            {type === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p className="auth-card__subtitle">
            {type === 'login'
              ? 'Accede a tu consola y proyectos DAW'
              : 'Únete al ecosistema DAW del futuro'}
          </p>
        </div>

        {status === 'success' ? (
          <div className="auth-success">
            <div className="auth-success__icon">
              <CheckCircle size={40} />
            </div>
            <h2 className="auth-success__title">Revisa tu correo</h2>
            <p className="auth-success__desc">
              Hemos enviado un enlace de acceso a <strong>{email}</strong>.
              <br />
              Haz clic en el enlace para acceder a tu consola.
            </p>
            <button
              type="button"
              className="auth-form__submit auth-form__submit--ghost"
              onClick={() => {
                setStatus('idle');
                setEmail('');
              }}
            >
              Enviar de nuevo
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="auth-form">
            {status === 'error' && errorMessage && (
              <div className="auth-form__error">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="auth-form__group">
              <label htmlFor="email">Email</label>
              <div className="auth-form__input-wrapper">
                <Mail size={18} className="auth-form__icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={status === 'loading'}
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-form__submit"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <span className="auth-form__loading">
                  <span className="auth-form__spinner" />
                  Enviando enlace...
                </span>
              ) : (
                <>
                  Continuar con Magic Link
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="auth-card__footer">
          {type === 'login' ? (
            <p>¿No tienes una cuenta? <Link to="/signup">Regístrate aquí</Link></p>
          ) : (
            <p>¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link></p>
          )}
        </div>
      </div>
    </div>
  );
}
