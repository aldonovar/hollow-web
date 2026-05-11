import { useState, useEffect, useRef } from 'react';
import {
  User, AtSign, Mail, Lock, Shield, Camera, Save, AlertCircle, CheckCircle,
  LogOut, KeyRound, Eye, EyeOff, Loader2, ChevronRight, Copy, X, Clock, MonitorSmartphone, CreditCard, Laptop, Globe, Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { usePageMotion } from '../components/usePageMotion';
import { formatCountLimit, formatStorageLimit, getTierLimits, resolveTier } from '@hollowbits/core';
import './Settings.css';

type FeedbackStatus = 'idle' | 'saving' | 'success' | 'error';

export function Settings() {
  const pageRef = usePageMotion();
  const navigate = useNavigate();
  const { user, session, profile, signOut, refreshProfile } = useAuthStore();

  /* ─── Profile state ─────────────────────────────────────────── */
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<FeedbackStatus>('idle');
  const [profileMsg, setProfileMsg] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  /* ─── License & Sessions state ──────────────────────────────── */
  const [sessions, setSessions] = useState<any[]>([]);
  const [license, setLicense] = useState<any>(null);
  const [loadingExtra, setLoadingExtra] = useState(true);

  /* ─── Password state ────────────────────────────────────────── */
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
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
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  // Timer simulation (TOTP rotates every 30s based on epoch)
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

  /* ─── Fetch Sessions and License ────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    
    const fetchExtraData = async () => {
      try {
        setLoadingExtra(true);
        // Fetch sessions
        const { data: sessionData, error: sessionError } = await supabase.rpc('get_active_sessions');
        if (!sessionError && sessionData) setSessions(sessionData);

        // Fetch license
        const { data: licenseData, error: licenseError } = await supabase
          .from('licenses')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (!licenseError && licenseData) setLicense(licenseData);
      } catch (err) {
        console.error('[Settings] Error fetching extra settings data:', err);
      } finally {
        setLoadingExtra(false);
      }
    };

    fetchExtraData();
  }, [user]);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.rpc('revoke_device_session', { target_session_id: sessionId });
      if (error) {
        console.error('[Settings] Failed to revoke session:', error);
        return;
      }
      if (data) {
        setSessions(s => s.filter(x => x.id !== sessionId));
      }
    } catch (err) {
      console.error('[Settings] Revoke error:', err);
    }
  };

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

    if (!isOAuthUser && !currentPassword) {
      setPwStatus('error');
      setPwMsg('Debes ingresar tu contraseña actual.');
      return;
    }

    if (newPassword.length < 6) {
      setPwStatus('error');
      setPwMsg('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwStatus('error');
      setPwMsg('Las contraseñas nuevas no coinciden.');
      return;
    }

    setPwStatus('saving');

    try {
      // Si el usuario es de email, verificamos la contraseña actual primero
      if (!isOAuthUser && emailAddress) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: emailAddress,
          password: currentPassword,
        });

        if (verifyError) {
          setPwStatus('error');
          setPwMsg('La contraseña actual es incorrecta.');
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setPwStatus('error');
        setPwMsg(error.message);
      } else {
        setPwStatus('success');
        setPwMsg(isOAuthUser
          ? '¡Contraseña establecida! Ahora puedes iniciar sesión con correo y contraseña.'
          : 'Contraseña actualizada correctamente.');
        setCurrentPassword('');
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
      // Limpiar factores no verificados previamente para evitar conflictos
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      if (factorsData?.totp) {
        for (const factor of factorsData.totp) {
          if ((factor as any).status === 'unverified') {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          }
        }
      }

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
      const challengeAndVerify = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactorId,
        code: mfaVerifyCode.trim(),
      });

      if (challengeAndVerify.error) {
        setMfaMsg('Código inválido. Intenta de nuevo.');
      } else {
        setMfaEnabled(true);
        setMfaQr(null);
        setMfaSecret(null);
        setMfaVerifyCode('');
        setMfaMsg('¡Autenticación de dos factores activada correctamente!');
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

  const handleCancelMfa = async () => {
    if (mfaFactorId) {
      // Intentamos limpiarlo en background para no bloquear la UI
      supabase.auth.mfa.unenroll({ factorId: mfaFactorId }).catch(() => {});
    }
    setMfaQr(null);
    setMfaSecret(null);
    setMfaFactorId(null);
    setMfaVerifyCode('');
    setMfaMsg('');
  };

  const handleCopySecret = () => {
    if (mfaSecret) {
      navigator.clipboard.writeText(mfaSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

        {/* ─── SUBSCRIPTION & BILLING SECTION ─── */}
        <section className="settings__section">
          <div className="settings__section-label">
            <CreditCard size={14} />
            <span>Suscripción y Facturación</span>
          </div>

          <div className="settings__card">
            <h3 className="settings__card-title">Tu Plan</h3>
            <p className="settings__card-desc">Administra tu suscripción, límites y facturación.</p>
            
            {loadingExtra ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-2)' }}>
                <Loader2 size={16} className="settings__spinner" /> Cargando...
              </div>
            ) : (() => {
              const tierRaw = resolveTier(license?.tier || profile?.tier || 'free');
              const tierName = tierRaw === 'studio' ? 'Studio' : tierRaw === 'pro' ? 'Pro' : 'Free';
              const tierColor = tierRaw === 'studio' ? '#f59e0b' : tierRaw === 'pro' ? '#a855f7' : '#6b7280';
              const tierBgColor = tierRaw === 'studio' ? 'rgba(245,158,11,0.1)' : tierRaw === 'pro' ? 'rgba(168,85,247,0.1)' : 'rgba(107,114,128,0.1)';
              const isActive = license?.status === 'active';
              const isCancelling = license?.cancel_at_period_end === true;
              const periodEnd = license?.current_period_end ? new Date(license.current_period_end) : null;

              const tierLimits = getTierLimits(tierRaw);
              const currentLimits = {
                storage: formatStorageLimit(tierLimits.storageBytes),
                collab: tierLimits.maxCollaborators,
                ai: formatCountLimit(tierLimits.aiRequestsPerMonth, '/mes'),
                samples: tierLimits.sampleDownloadsPerMonth === 0
                  ? '-'
                  : formatCountLimit(tierLimits.sampleDownloadsPerMonth, '/mes'),
              };

              return (
                <>
                  {/* Plan badge + status */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '8px', border: `1px solid ${tierColor}22`, marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{
                            fontSize: '22px', fontWeight: 700, color: tierColor,
                            letterSpacing: '0.03em', textTransform: 'uppercase',
                          }}>
                            {tierName}
                          </span>
                          <span style={{
                            fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em',
                            background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                            color: isActive ? '#22c55e' : '#ef4444',
                            padding: '4px 10px', borderRadius: '4px', fontWeight: 600,
                          }}>
                            {isCancelling ? 'Cancela al final del período' : (isActive ? 'Activo' : (license?.status || 'Sin licencia'))}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-2)' }}>
                          {tierRaw === 'free'
                            ? 'Acceso completo al motor de audio, instrumentos básicos y collab limitada.'
                            : periodEnd
                              ? `Próxima renovación: ${periodEnd.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}.`
                              : 'Suscripción activa.'
                          }
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        {tierRaw !== 'studio' && (
                          <button
                            className="settings__save-btn"
                            onClick={() => navigate('/pricing')}
                            style={{ width: 'auto', fontSize: '13px', padding: '10px 20px' }}
                          >
                            {tierRaw === 'free' ? '⚡ Mejorar a Pro' : '⚡ Mejorar a Studio'}
                          </button>
                        )}
                        {tierRaw !== 'free' && (
                          <button
                            className="settings__save-btn settings__save-btn--secondary"
                            onClick={() => {
                            // TODO: Connect to Mercado Pago / Niubiz Portal when secrets are configured
                              window.alert('Portal de facturación (Mercado Pago) próximamente. Contacta soporte para gestionar tu suscripción.');
                            }}
                            style={{ width: 'auto', fontSize: '13px', padding: '10px 20px' }}
                          >
                            Gestionar Facturación
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quotas grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    {[
                      { label: 'Almacenamiento', value: currentLimits.storage, icon: '💾' },
                      { label: 'Colaboradores RT', value: `${currentLimits.collab} usuarios`, icon: '👥' },
                      { label: 'Requests IA', value: currentLimits.ai, icon: '🤖' },
                      { label: 'Samples/mes', value: currentLimits.samples, icon: '🎵' },
                    ].map(q => (
                      <div key={q.label} style={{
                        background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>{q.icon}</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{q.value}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>{q.label}</div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
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
              {/* Current Password (only for email users) */}
              {!isOAuthUser && (
                <div className="settings__field">
                  <label>Contraseña Actual</label>
                  <div className="settings__input-wrapper">
                    <Lock size={16} className="settings__input-icon" />
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Tu contraseña actual"
                    />
                    <button
                      type="button"
                      className="settings__pw-toggle"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                    >
                      {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

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
              <div className="settings__mfa-enroll" style={{ border: '1px solid rgba(168, 85, 247, 0.2)', padding: '24px', borderRadius: '4px', background: 'rgba(10,10,10,0.6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div>
                    <h4 style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '14px', color: '#a855f7', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sincronización TOTP</h4>
                    <p className="settings__mfa-instruction" style={{ margin: 0, fontSize: '13px' }}>
                      Escanea este código QR con tu aplicación de autenticación:
                    </p>
                  </div>
                  <button 
                    className="settings__cancel-btn" 
                    onClick={handleCancelMfa}
                    title="Cancelar configuración"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="settings__mfa-qr" style={{ padding: '16px', background: '#fff', display: 'inline-block', borderRadius: '8px', marginBottom: '16px' }}>
                  <img src={mfaQr} alt="MFA QR Code" style={{ display: 'block' }} />
                </div>
                
                {mfaSecret && (
                  <div className="settings__mfa-secret-box" style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <span className="settings__mfa-secret-label" style={{ fontSize: '12px', color: 'var(--text-2)' }}>Clave manual:</span>
                    <code className="settings__mfa-secret-code" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#a855f7', fontSize: '14px', letterSpacing: '0.1em' }}>{mfaSecret}</code>
                    <button className="settings__copy-btn" onClick={handleCopySecret} title="Copiar clave" style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer' }}>
                      {copied ? <CheckCircle size={16} color="#a855f7" /> : <Copy size={16} />}
                    </button>
                  </div>
                )}
                
                <div className="mfa-timer" style={{ marginBottom: '24px' }}>
                  <div className="mfa-timer__header">
                    <span className={`mfa-timer__text ${timeLeft <= 5 ? 'mfa-timer__text--urgent' : ''}`}>
                      <Clock size={12} /> {timeLeft}s para rotación de código
                    </span>
                  </div>
                  <div className="mfa-timer__track">
                    <div 
                      className={`mfa-timer__bar ${timeLeft <= 5 ? 'mfa-timer__bar--urgent' : ''}`}
                      style={{ width: `${(timeLeft / 30) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="settings__field">
                  <div className="mfa-input-container">
                    <input
                      type="text"
                      className="mfa-input"
                      style={{ padding: '16px', fontSize: '24px', letterSpacing: '0.4em' }}
                      value={mfaVerifyCode}
                      onChange={e => setMfaVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="0 0 0 0 0 0"
                      maxLength={6}
                    />
                  </div>
                </div>
                
                <button
                  className={`mfa-submit-btn ${mfaVerifyCode.length === 6 ? 'mfa-submit-btn--ready' : ''}`}
                  style={{ width: '100%', marginTop: '24px' }}
                  onClick={handleVerifyMfa}
                  disabled={mfaLoading || mfaVerifyCode.length < 6}
                >
                  <div className="mfa-submit-btn__bg"></div>
                  {mfaLoading ? (
                    <span className="mfa-submit-btn__content">
                      <Loader2 size={16} className="settings__spinner" /> VERIFICANDO...
                    </span>
                  ) : (
                    <span className="mfa-submit-btn__content">
                      VERIFICAR Y ACTIVAR 2FA <Shield size={16} />
                    </span>
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

          {/* Active Devices */}
          <div className="settings__card">
            <h3 className="settings__card-title">
              <MonitorSmartphone size={18} /> Dispositivos Activos
            </h3>
            <p className="settings__card-desc">
              Revisa y revoca el acceso a dispositivos donde tienes sesiones abiertas.
            </p>

            <div className="settings__sessions-list" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingExtra ? (
                 <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-2)' }}>
                   <Loader2 size={16} className="settings__spinner" /> Cargando sesiones...
                 </div>
              ) : sessions.length === 0 ? (
                <p style={{ color: 'var(--text-2)', fontSize: '13px' }}>No hay sesiones activas adicionales.</p>
              ) : (
                sessions.map(s => {
                  const isCurrent = false; // Cannot reliably determine session ID from frontend without decoding JWT
                  const userAgent = s.user_agent || '';
                  const isDesktop = userAgent.toLowerCase().includes('windows') || userAgent.toLowerCase().includes('macintosh') || userAgent.toLowerCase().includes('linux');
                  const parsedName = userAgent.split(' ').slice(0, 3).join(' ') || 'Dispositivo Desconocido';
                  
                  return (
                    <div key={s.id} className="settings__session-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-1)' }}>
                          {isDesktop ? <Laptop size={18} /> : <Globe size={18} />}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', color: '#fff' }}>{parsedName}</h4>
                            {isCurrent && (
                              <span style={{ fontSize: '10px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Este Dispositivo
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-2)' }}>
                            IP: {s.ip || 'Oculta'} • Última act: {new Date(s.last_active).toLocaleString('es-MX')}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRevokeSession(s.id)}
                        title="Revocar sesión"
                        style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: '8px', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
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
