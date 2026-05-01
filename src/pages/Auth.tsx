import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle, Lock, User, AtSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Auth.css';

type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

export function Auth({ type }: { type: 'login' | 'signup' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Campos extra para signup
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    
    if (type === 'signup') {
      if (!fullName.trim() || !username.trim() || !password) {
        setStatus('error');
        setErrorMessage('Por favor, completa todos los campos obligatorios.');
        return;
      }
      
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password,
        options: {
          data: {
            full_name: fullName,
            username: username
          },
          emailRedirectTo: `${window.location.origin}/console`,
        }
      });

      if (error) {
        setStatus('error');
        setErrorMessage(error.message);
        return;
      }
      
      // Si el registro requiere confirmación de email (comportamiento por defecto en Supabase)
      setStatus('success');
      
    } else {
      // Login
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      });

      if (error) {
        setStatus('error');
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('El correo o la contraseña son incorrectos.');
        } else {
          setErrorMessage(error.message);
        }
        return;
      }
      
      // Si el login es exitoso, la redirección a /console se maneja por el App.tsx (authStore cambia de estado)
    }
  };

  const handleGoogleLogin = async () => {
    setStatus('loading');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/console`
      }
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  if (status === 'success' && type === 'signup') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <img src="/logo-sphere.svg" alt="HOLLOW bits" className="auth-card__logo" />
            <h1 className="auth-card__title">Verifica tu Identidad</h1>
            <p className="auth-card__subtitle">Hemos enviado un correo a {email}</p>
          </div>
          <div className="auth-success">
            <p className="auth-success__desc">
              Por favor revisa tu bandeja de entrada y haz clic en el enlace de confirmación para activar tu cuenta en la red.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__glitch-bar" />
        <div className="auth-card__header">
          <img src="/logo-sphere.svg" alt="HOLLOW bits" className="auth-card__logo" />
          <h1 className="auth-card__title">
            {type === 'login' ? 'Iniciar Sesión' : 'Registro de Operador'}
          </h1>
          <p className="auth-card__subtitle">
            {type === 'login'
              ? 'Accede a tu consola y proyectos DAW'
              : 'Configura tus credenciales para el ecosistema DAW'}
          </p>
        </div>

        <button 
          type="button" 
          className="auth-google-btn"
          onClick={handleGoogleLogin}
          disabled={status === 'loading'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </button>

        <div className="auth-divider">
          <span>o ingresa con tu correo</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {status === 'error' && errorMessage && (
            <div className="auth-form__error">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {type === 'signup' && (
            <>
              <div className="auth-form__group">
                <label htmlFor="fullName">Nombre Completo</label>
                <div className="auth-form__input-wrapper">
                  <User size={18} className="auth-form__icon" />
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Tu nombre real"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={status === 'loading'}
                  />
                </div>
              </div>

              <div className="auth-form__group">
                <label htmlFor="username">Nombre de Usuario</label>
                <div className="auth-form__input-wrapper">
                  <AtSign size={18} className="auth-form__icon" />
                  <input
                    id="username"
                    type="text"
                    placeholder="ej. soundmaker99"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={status === 'loading'}
                  />
                </div>
              </div>
            </>
          )}

          <div className="auth-form__group">
            <label htmlFor="email">Correo Electrónico</label>
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

          <div className="auth-form__group">
            <label htmlFor="password">Contraseña</label>
            <div className="auth-form__input-wrapper">
              <Lock size={18} className="auth-form__icon" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={type === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
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
                Procesando...
              </span>
            ) : (
              <>
                {type === 'login' ? 'Acceder al Sistema' : 'Completar Registro'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

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
