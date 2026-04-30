import { useState, useEffect } from 'react';
import { Shield, ArrowRight, AlertCircle, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import './Auth.css'; // Reusing auth styles

export function MfaChallenge() {
  const [mfaCode, setMfaCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [factorId, setFactorId] = useState<string | null>(null);
  const { checkMfa, signOut } = useAuthStore();

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verifiedFactor = data?.totp?.find(f => f.status === 'verified');
      if (verifiedFactor) {
        setFactorId(verifiedFactor.id);
      } else {
        // Fallback: If no verified factor is found but we are here, 
        // AAL says we need MFA. We might have a sync issue, so we just wait.
      }
    });
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setStatus('loading');
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: mfaCode.trim()
      });

      if (error) throw error;
      
      // Success! Update auth store state
      await checkMfa();
    } catch (err: any) {
      console.error('[MFA Challenge]', err);
      setStatus('error');
      setErrorMessage('Código de verificación inválido. Intenta de nuevo.');
    }
  };

  return (
    <div className="auth-page" style={{ position: 'relative' }}>
      {/* Botón de cierre de sesión de emergencia */}
      <button 
        onClick={() => signOut()}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: 'var(--text-2)',
          cursor: 'pointer',
          fontFamily: 'Inter',
          fontSize: '0.85rem'
        }}
      >
        <LogOut size={16} /> Cerrar Sesión
      </button>

      <div className="auth-card">
        <div className="auth-card__header">
          <img src="/logo-sphere.svg" alt="HOLLOW bits" className="auth-card__logo" />
          <h1 className="auth-card__title">Seguridad 2FA</h1>
          <p className="auth-card__subtitle">
            Ingresa el código generado por tu aplicación autenticadora para acceder al sistema.
          </p>
        </div>
        
        <form onSubmit={handleVerify} className="auth-form">
          {status === 'error' && errorMessage && (
            <div className="auth-form__error">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}
          
          <div className="auth-form__group">
            <label htmlFor="mfaCode">Código de Verificación</label>
            <div className="auth-form__input-wrapper">
              <Shield size={18} className="auth-form__icon" />
              <input
                id="mfaCode"
                type="text"
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                maxLength={6}
                required
                disabled={status === 'loading'}
                autoFocus
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="auth-form__submit"
            disabled={status === 'loading' || mfaCode.length < 6 || !factorId}
          >
            {status === 'loading' ? (
              <span className="auth-form__loading">
                <span className="auth-form__spinner" /> Verificando...
              </span>
            ) : (
              <>Verificar Acceso <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
