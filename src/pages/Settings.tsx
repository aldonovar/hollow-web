import { useState, useEffect, useRef } from 'react';
import {
  User, AtSign, Mail, Lock, Shield, Camera, Save, AlertCircle, CheckCircle,
  LogOut, KeyRound, Eye, EyeOff, Loader2, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { usePageMotion } from '../components/usePageMotion';
import './Settings.css';

type FeedbackStatus = 'idle' | 'saving' | 'success' | 'error';

export function Settings() {
  const pageRef = usePageMotion();
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuthStore();

  /* ─── Profile state ─────────────────────────────────────────── */
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<FeedbackStatus>('idle');
  const [profileMsg, setProfileMsg] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  /* ─── Password state ────────────────────────────────────────── */
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwStatus, setPwStatus] = useState<FeedbackStatus>('idle');
  const [pwMsg, setPwMsg] = useState('');

  /* ─── MFA state ─────────────────────────────────────────────── */
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaQr, setMfaQr] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaMsg, setMfaMsg] = useState('');

  /* ─── Computed ──────────────────────────────────────────────── */
  const authProvider = user?.app_metadata?.provider || 'email';
  const isOAuthUser = authProvider !== 'email';
  const emailAddress = user?.email || '';
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  /* ─── Hydrate from profile ──────────────────────────────────── */
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  /* ─── Check MFA status on mount ─────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.mfa.listFactors();
        if (data?.totp && data.totp.length > 0) {
          const verified = data.totp.find(f => f.status === 'verified');
          if (verified) {
            setMfaEnabled(true);
            setMfaFactorId(verified.id);
          }
        }
      } catch (err) {
        console.error('[Settings] Error checking MFA status:', err);
      }
    })();
  }, []);

  /* ─── Save Profile ──────────────────────────────────────────── */
  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileStatus('saving');
    setProfileMsg('');

    try {
      const trimmedUsername = username.trim().toLowerCase().replace(/\s+/g, '_');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: trimmedUsername,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        setProfileStatus('error');
        setProfileMsg(error.message.includes('duplicate')
          ? 'Ese nombre de usuario ya está en uso.'
          : error.message);
      } else {
        setProfileStatus('success');
        setProfileMsg('Perfil actualizado correctamente.');
        refreshProfile();
        setTimeout(() => setProfileStatus('idle'), 3000);
      }
    } catch (err: any) {
      console.error('[Settings] Profile save error:', err);
      setProfileStatus('error');
      setProfileMsg(err?.message || 'Error inesperado al guardar el perfil.');
    }
  };

  /* ─── Avatar Upload ─────────────────────────────────────────── */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setProfileMsg('Error al subir la imagen: ' + uploadError.message);
        setProfileStatus('error');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(urlData.publicUrl);
      setProfileMsg('Imagen cargada. Guarda los cambios para aplicar.');
      setProfileStatus('idle');
    } catch (err: any) {
      console.error('[Settings] Avatar upload error:', err);
      setProfileMsg('Error inesperado al subir la imagen.');
      setProfileStatus('error');
    }
  };

  /* ─── Change/Set Password ───────────────────────────────────── */
  const handlePasswordChange = async () => {
    setPwMsg('');

    if (newPassword.length < 6) {
      setPwStatus('error');
      setPwMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwStatus('error');
      setPwMsg('Las contraseñas no coinciden.');
      return;
    }

    setPwStatus('saving');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setPwStatus('error');
        setPwMsg(error.message);
      } else {
        setPwStatus('success');
        setPwMsg(isOAuthUser
          ? '¡Contraseña establecida! Ahora puedes iniciar sesión con correo y contraseña.'
          : 'Contraseña actualizada correctamente.');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPwStatus('idle'), 4000);
      }
    } catch (err: any) {
      console.error('[Settings] Password change error:', err);
      setPwStatus('error');
      setPwMsg(err?.message || 'Error inesperado al cambiar la contraseña.');
    }
  };

  /* ─── MFA Enroll ────────────────────────────────────────────── */
  const handleEnrollMfa = async () => {
    setMfaLoading(true);
    setMfaMsg('');

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'HollowBits Auth',
      });

      if (error || !data) {
        setMfaMsg(error?.message || 'Error al activar 2FA.');
        setMfaLoading(false);
        return;
      }

      setMfaQr(data.totp.qr_code);
      setMfaSecret(data.totp.secret);
      setMfaFactorId(data.id);
    } catch (err: any) {
      console.error('[Settings] MFA enroll error:', err);
      setMfaMsg(err?.message || 'Error inesperado al configurar 2FA.');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaFactorId) return;
    setMfaLoading(true);
    setMfaMsg('');

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challenge.error) {
        setMfaMsg(challenge.error.message);
        setMfaLoading(false);
        return;
      }

      const verify = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.data.id,
        code: mfaVerifyCode,
      });

      if (verify.error) {
        setMfaMsg('Código inválido. Intenta de nuevo.');
      } else {
        setMfaEnabled(true);
        setMfaQr(null);
        setMfaSecret(null);
        setMfaVerifyCode('');
        setMfaMsg('¡Autenticación de dos factores activada!');
      }
    } catch (err: any) {
      console.error('[Settings] MFA verify error:', err);
      setMfaMsg(err?.message || 'Error inesperado al verificar el código.');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleUnenrollMfa = async () => {
    if (!mfaFactorId) return;
    setMfaLoading(true);

    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
      if (error) {
        setMfaMsg(error.message);
      } else {
        setMfaEnabled(false);
        setMfaFactorId(null);
        setMfaMsg('Autenticación de dos factores desactivada.');
      }
    } catch (err: any) {
      console.error('[Settings] MFA unenroll error:', err);
      setMfaMsg(err?.message || 'Error inesperado.');
    } finally {
      setMfaLoading(false);
    }
  };

  /* ─── Sign Out ──────────────────────────────────────────────── */
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  /* ─── Render ────────────────────────────────────────────────── */
  const avatarDisplay = avatarUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'U')}&background=a855f7&color=fff&size=128&bold=true`;

  return (
    <div className="page-shell" ref={pageRef} style={{ paddingTop: '120px' }}>
      <div className="settings">
        {/* ─── HEADER ─── */}
        <div className="settings__header">
          <h1 className="settings__title">Configuración de la Cuenta</h1>
          <p className="settings__subtitle">
            Administra tu perfil, seguridad y preferencias del ecosistema.
          </p>
        </div>

        {/* ─── PROFILE SECTION ─── */}
        <section className="settings__section">
          <div className="settings__section-label">
            <User size={14} />
            <span>Perfil de Operador</span>
          </div>

          <div className="settings__card">
            {/* Avatar */}
            <div className="settings__avatar-area">
              <div className="settings__avatar" onClick={() => avatarInputRef.current?.click()}>
                <img src={avatarDisplay} alt="Avatar" className="settings__avatar-img" />
                <div className="settings__avatar-overlay">
                  <Camera size={20} />
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarUpload}
              />
              <div className="settings__avatar-info">
                <p className="settings__avatar-name">{fullName || 'Sin nombre'}</p>
                <p className="settings__avatar-provider">
                  {isOAuthUser ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Vinculado con Google
                    </>
                  ) : (
                    <>
                      <Mail size={14} />
                      Registrado con correo
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Fields */}
            <div className="settings__fields">
              <div className="settings__field">
                <label>Nombre Completo</label>
                <div className="settings__input-wrapper">
                  <User size={16} className="settings__input-icon" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Tu nombre real"
                  />
                </div>
              </div>

              <div className="settings__field">
                <label>Nombre de Usuario</label>
                <div className="settings__input-wrapper">
                  <AtSign size={16} className="settings__input-icon" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="ej. soundmaker99"
                  />
                </div>
              </div>

              <div className="settings__field">
                <label>Correo Electrónico</label>
                <div className="settings__input-wrapper settings__input-wrapper--disabled">
                  <Mail size={16} className="settings__input-icon" />
                  <input type="email" value={emailAddress} disabled />
                </div>
                <span className="settings__field-hint">
                  El correo no se puede modificar directamente.
                </span>
              </div>

              <div className="settings__field">
                <label>Miembro desde</label>
                <div className="settings__input-wrapper settings__input-wrapper--disabled">
                  <KeyRound size={16} className="settings__input-icon" />
                  <input type="text" value={createdAt} disabled />
                </div>
              </div>
            </div>

            {/* Feedback */}
            {profileStatus === 'error' && (
              <div className="settings__feedback settings__feedback--error">
                <AlertCircle size={15} /> {profileMsg}
              </div>
            )}
            {profileStatus === 'success' && (
              <div className="settings__feedback settings__feedback--success">
                <CheckCircle size={15} /> {profileMsg}
              </div>
            )}

            <button
              className="settings__save-btn"
              onClick={handleSaveProfile}
              disabled={profileStatus === 'saving'}
            >
              {profileStatus === 'saving' ? (
                <><Loader2 size={16} className="settings__spinner" /> Guardando...</>
              ) : (
                <><Save size={16} /> Guardar Cambios</>
              )}
            </button>
          </div>
        </section>

        {/* ─── SECURITY SECTION ─── */}
        <section className="settings__section">
          <div className="settings__section-label">
            <Lock size={14} />
            <span>Seguridad</span>
          </div>

          {/* Password */}
          <div className="settings__card">
            <h3 className="settings__card-title">
              {isOAuthUser ? 'Establecer Contraseña' : 'Cambiar Contraseña'}
            </h3>
            <p className="settings__card-desc">
              {isOAuthUser
                ? 'Iniciaste sesión con Google. Establece una contraseña para poder acceder también con correo y contraseña.'
                : 'Actualiza tu contraseña de acceso al ecosistema.'}
            </p>

            <div className="settings__fields settings__fields--security">
              <div className="settings__field">
                <label>Nueva Contraseña</label>
                <div className="settings__input-wrapper">
                  <Lock size={16} className="settings__input-icon" />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="settings__pw-toggle"
                    onClick={() => setShowNewPw(!showNewPw)}
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="settings__field">
                <label>Confirmar Contraseña</label>
                <div className="settings__input-wrapper">
                  <Lock size={16} className="settings__input-icon" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                  />
                  <button
                    type="button"
                    className="settings__pw-toggle"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                  >
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {pwStatus === 'error' && (
              <div className="settings__feedback settings__feedback--error">
                <AlertCircle size={15} /> {pwMsg}
              </div>
            )}
            {pwStatus === 'success' && (
              <div className="settings__feedback settings__feedback--success">
                <CheckCircle size={15} /> {pwMsg}
              </div>
            )}

            <button
              className="settings__save-btn settings__save-btn--secondary"
              onClick={handlePasswordChange}
              disabled={pwStatus === 'saving' || !newPassword}
            >
              {pwStatus === 'saving' ? (
                <><Loader2 size={16} className="settings__spinner" /> Procesando...</>
              ) : (
                <><KeyRound size={16} /> {isOAuthUser ? 'Establecer Contraseña' : 'Actualizar Contraseña'}</>
              )}
            </button>
          </div>

          {/* 2FA */}
          <div className="settings__card">
            <h3 className="settings__card-title">
              <Shield size={18} /> Verificación en Dos Pasos (2FA)
            </h3>
            <p className="settings__card-desc">
              Añade una capa extra de seguridad. Necesitarás una app de autenticación como Google Authenticator o Authy.
            </p>

            {mfaEnabled ? (
              <div className="settings__mfa-active">
                <div className="settings__mfa-badge">
                  <CheckCircle size={16} /> 2FA Activo
                </div>
                <button
                  className="settings__save-btn settings__save-btn--danger"
                  onClick={handleUnenrollMfa}
                  disabled={mfaLoading}
                >
                  Desactivar 2FA
                </button>
              </div>
            ) : mfaQr ? (
              <div className="settings__mfa-enroll">
                <p className="settings__mfa-instruction">
                  Escanea este código QR con tu aplicación de autenticación:
                </p>
                <div className="settings__mfa-qr">
                  <img src={mfaQr} alt="MFA QR Code" />
                </div>
                {mfaSecret && (
                  <p className="settings__mfa-secret">
                    Clave manual: <code>{mfaSecret}</code>
                  </p>
                )}
                <div className="settings__field" style={{ marginTop: '1rem' }}>
                  <label>Código de Verificación</label>
                  <div className="settings__input-wrapper">
                    <Shield size={16} className="settings__input-icon" />
                    <input
                      type="text"
                      value={mfaVerifyCode}
                      onChange={e => setMfaVerifyCode(e.target.value)}
                      placeholder="Ingresa el código de 6 dígitos"
                      maxLength={6}
                    />
                  </div>
                </div>
                <button
                  className="settings__save-btn"
                  onClick={handleVerifyMfa}
                  disabled={mfaLoading || mfaVerifyCode.length < 6}
                >
                  {mfaLoading ? (
                    <><Loader2 size={16} className="settings__spinner" /> Verificando...</>
                  ) : (
                    <><Shield size={16} /> Verificar y Activar</>
                  )}
                </button>
              </div>
            ) : (
              <button
                className="settings__save-btn settings__save-btn--secondary"
                onClick={handleEnrollMfa}
                disabled={mfaLoading}
              >
                {mfaLoading ? (
                  <><Loader2 size={16} className="settings__spinner" /> Configurando...</>
                ) : (
                  <><Shield size={16} /> Activar 2FA</>
                )}
              </button>
            )}

            {mfaMsg && (
              <div className={`settings__feedback ${mfaEnabled ? 'settings__feedback--success' : 'settings__feedback--error'}`}>
                {mfaEnabled ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {mfaMsg}
              </div>
            )}
          </div>
        </section>

        {/* ─── SESSION SECTION ─── */}
        <section className="settings__section">
          <div className="settings__section-label">
            <LogOut size={14} />
            <span>Sesión</span>
          </div>

          <div className="settings__card settings__card--danger">
            <div className="settings__session-row">
              <div>
                <h3 className="settings__card-title">Cerrar Sesión</h3>
                <p className="settings__card-desc">
                  Cierra tu sesión activa en este dispositivo.
                </p>
              </div>
              <button className="settings__signout-btn" onClick={handleSignOut}>
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          </div>
        </section>

        {/* ─── BACK TO CONSOLE ─── */}
        <button className="settings__back" onClick={() => navigate('/console')}>
          <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
          Volver a la Consola
        </button>
      </div>
    </div>
  );
}
