import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { X, UserPlus } from 'lucide-react';

interface InviteUserModalProps {
  onClose: () => void;
  teamId?: string;
  projectId?: string;
  contextName: string;
}

export function InviteUserModal({ onClose, teamId, projectId, contextName }: InviteUserModalProps) {
  const { user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInvite = async () => {
    if (!email.trim() || !user) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Find user by email (We assume email is stored in profiles, or we have to invite via email function if Supabase edge func exists. Wait, if we don't have their email in profiles, we might just insert it and let RLS block it if it fails. Actually, profiles table might not expose emails. Let's do a loose lookup or just insert the notification and let a trigger/webhook handle it. But wait, `user_notifications` requires `user_id`.)
      
      // Since we might not have access to auth.users, let's search by username in profiles instead to be safe, or just insert into project_shares if it's a project.
      
      // Let's assume the user enters an exact username for now, to ensure we can find their profile.
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('id')
        .or(`username.eq.${email.trim()},full_name.eq.${email.trim()}`)
        .limit(1)
        .single();

      if (profileErr || !profileData) {
        throw new Error('No se encontró un usuario con ese nombre de usuario o nombre.');
      }

      const inviteType = teamId ? 'team_invite' : 'project_invite';
      const message = `Has sido invitado a colaborar en ${contextName} como ${role}.`;

      const { error: inviteError } = await supabase
        .from('user_notifications')
        .insert([{
          user_id: profileData.id,
          sender_id: user.id,
          type: inviteType,
          status: 'pending',
          team_id: teamId || null,
          project_id: projectId || null,
          message
        }]);

      if (inviteError) throw inviteError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error inviting user:', err);
      setError(err.message || 'Error al enviar la invitación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
        padding: '32px', maxWidth: '420px', width: '90%', position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(168,85,247,0.1)', padding: '12px', borderRadius: '8px', color: 'var(--purple)' }}>
            <UserPlus size={24} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '1.4rem', margin: 0 }}>Invitar Usuario</h3>
            <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', margin: 0 }}>a {contextName}</p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
            ¡Invitación enviada con éxito!
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-2)' }}>Nombre de usuario exacto</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ej. hollowuser"
            disabled={success}
            style={{
              width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
              borderRadius: '4px', color: 'var(--text)', fontFamily: 'Inter, sans-serif'
            }}
          />
        </div>

        {teamId && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-2)' }}>Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={success}
              style={{
                width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                borderRadius: '4px', color: 'var(--text)', fontFamily: 'Inter, sans-serif', outline: 'none'
              }}
            >
              <option value="viewer">Lector (Viewer)</option>
              <option value="editor">Editor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: teamId ? 0 : '24px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px', background: 'transparent', border: '1px solid var(--border)',
              borderRadius: '4px', color: 'var(--text)', cursor: 'pointer', fontFamily: 'JetBrains Mono',
              fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em'
            }}
          >{success ? 'Cerrar' : 'Cancelar'}</button>
          {!success && (
            <button
              onClick={handleInvite}
              disabled={loading || !email.trim()}
              style={{
                padding: '10px 24px', background: 'var(--purple)', border: 'none', borderRadius: '4px',
                color: '#fff', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: '12px',
                fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: (loading || !email.trim()) ? 0.5 : 1
              }}
            >{loading ? 'Enviando...' : 'Invitar'}</button>
          )}
        </div>
      </div>
    </div>
  );
}
