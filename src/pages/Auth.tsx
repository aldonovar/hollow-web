import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogIn, Lock, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Auth.css';

export function Auth({ type }: { type: 'login' | 'signup' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (type === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        navigate('/console');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        navigate('/console');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <img src="/logo-sphere.svg" alt="HOLLOW bits" className="auth-card__logo" />
          <h1 className="auth-card__title">{type === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</h1>
          <p className="auth-card__subtitle">
            {type === 'login' ? 'Accede a tu consola y proyectos DAW' : 'Únete al ecosistema DAW del futuro'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          {error && <div className="auth-form__error">{error}</div>}
          
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
              />
            </div>
          </div>

          <button type="submit" className="auth-form__submit" disabled={loading}>
            {loading ? (
              <span className="auth-form__loading">Procesando...</span>
            ) : type === 'login' ? (
              <>
                Iniciar Sesión
                <LogIn size={18} />
              </>
            ) : (
              <>
                Crear Cuenta
                <User size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-card__footer">
          {type === 'login' ? (
            <p>¿No tienes una cuenta? <a href="/signup">Regístrate aquí</a></p>
          ) : (
            <p>¿Ya tienes una cuenta? <a href="/login">Inicia sesión</a></p>
          )}
        </div>
      </div>
    </div>
  );
}
