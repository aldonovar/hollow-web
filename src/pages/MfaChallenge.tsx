import { useState, useEffect } from 'react';
import { Shield, ArrowRight, AlertCircle, LogOut, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import './Auth.css';

export function MfaChallenge() {
  const [mfaCode, setMfaCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'fatal'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  
  // Para el efecto visual del tiempo (30 segundos rotación TOTP)
  const [timeLeft, setTimeLeft] = useState(30);
  
  const { checkMfa, signOut } = useAuthStore();

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (error) {
        setStatus('fatal');
        setErrorMessage('Error al obtener la configuración 2FA.');
        return;
      }
      const verifiedFactor = data?.totp?.find(f => f.status === 'verified');
      if (verifiedFactor) {
        setFactorId(verifiedFactor.id);
      } else {
        setStatus('fatal');
        setErrorMessage('No se encontró un factor 2FA verificado. Por favor, cierra sesión y contacta a soporte.');
      }
    });
  }, []);

  // Timer simulation (TOTP rotates every 30s based on epoch, here we just do a visual loop)
  useEffect(() => {
    const epoch = Math.floor(Date.now() / 1000);
    const currentSeconds = epoch % 30;
    setTimeLeft(30 - currentSeconds);

    const interval = setInterval(() => {
      const e = Math.floor(Date.now() / 1000);
      setTimeLeft(30 - (e % 30));
    }, 1000);
    
    return () => clearInterval(interval);
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
      
      await checkMfa();
    } catch (err: any) {
      console.error('[MFA Challenge]', err);
      setStatus('error');
      setErrorMessage('Código de verificación inválido o expirado.');
      setMfaCode(''); // Limpiar código para reintentar rápidamente
    }
  };

  const timerPercentage = (timeLeft / 30) * 100;
  const isUrgent = timeLeft <= 5;

  return (
    <div className="auth-page mfa-page">
      <div className="site-shell__noise"></div>
      
      <button 
        onClick={() => signOut()}
        className="mfa-emergency-exit"
      >
        <LogOut size={16} /> ABORTAR SESIÓN
      </button>

      <div className="mfa-card">
        <div className="mfa-card__glitch-bar"></div>
        
        <div className="mfa-header">
          <div className="mfa-header__icon-wrapper">
            <Shield size={32} className="mfa-header__icon" />
          </div>
          <h1 className="mfa-header__title">PROTOCOLOS DE SEGURIDAD ACTIVOS</h1>
          <p className="mfa-header__subtitle">
            AAL2 REQUERIDO: Inserte su código TOTP para desencriptar la sesión.
          </p>
        </div>
        
        {status === 'fatal' ? (
          <div className="mfa-fatal-error">
            <AlertCircle size={24} />
            <p>{errorMessage}</p>
            <button className="btn btn--primary" onClick={() => signOut()}>
              Volver al inicio
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="mfa-form">
            {status === 'error' && errorMessage && (
              <div className="mfa-error-banner">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}
            
            <div className="mfa-input-container">
              <input
                id="mfaCode"
                type="text"
                placeholder="0 0 0 0 0 0"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))} // Solo números
                maxLength={6}
                required
                disabled={status === 'loading'}
                autoFocus
                className="mfa-input"
                autoComplete="off"
              />
              <div className="mfa-input-focus-line"></div>
            </div>

            <div className="mfa-timer">
              <div className="mfa-timer__header">
                <span className={`mfa-timer__text ${isUrgent ? 'mfa-timer__text--urgent' : ''}`}>
                  <Clock size={12} /> {timeLeft}s para expiración de rotación
                </span>
              </div>
              <div className="mfa-timer__track">
                <div 
                  className={`mfa-timer__bar ${isUrgent ? 'mfa-timer__bar--urgent' : ''}`}
                  style={{ width: `${timerPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <button
              type="submit"
              className={`mfa-submit-btn ${mfaCode.length === 6 ? 'mfa-submit-btn--ready' : ''}`}
              disabled={status === 'loading' || mfaCode.length < 6 || !factorId}
            >
              <div className="mfa-submit-btn__bg"></div>
              {status === 'loading' ? (
                <span className="mfa-submit-btn__content">
                  <span className="auth-form__spinner" /> VERIFICANDO MATRIZ...
                </span>
              ) : (
                <span className="mfa-submit-btn__content">
                  AUTORIZAR ACCESO <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
