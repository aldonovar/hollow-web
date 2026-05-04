import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { X, Cloud } from 'lucide-react';

interface CreateTeamModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTeamModal({ onClose, onSuccess }: CreateTeamModalProps) {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Band');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    setError(null);

    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);

      const { data: newWorkspace, error: createError } = await supabase
        .from('workspaces')
        .insert([{
          name: name.trim(),
          slug,
          created_by: user.id,
          category
        }])
        .select()
        .single();

      if (createError) throw createError;

      // Automatically add the creator as an owner
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert([{
          workspace_id: newWorkspace.id,
          user_id: user.id,
          role: 'owner'
        }]);

      if (memberError) throw memberError;

      onSuccess();
    } catch (err: any) {
      console.error('Error creating team:', err);
      setError(err.message || 'Error al crear el equipo.');
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
            <Cloud size={24} />
          </div>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '1.4rem', margin: 0 }}>Crear Equipo</h3>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-2)' }}>Nombre del Equipo</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Mi Banda"
            style={{
              width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
              borderRadius: '4px', color: 'var(--text)', fontFamily: 'Inter, sans-serif'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-2)' }}>Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
              borderRadius: '4px', color: 'var(--text)', fontFamily: 'Inter, sans-serif', outline: 'none'
            }}
          >
            <option value="Band">Banda</option>
            <option value="Label">Sello Discográfico</option>
            <option value="Studio">Estudio</option>
            <option value="Educational">Educativo</option>
            <option value="Other">Otro</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 24px', background: 'transparent', border: '1px solid var(--border)',
              borderRadius: '4px', color: 'var(--text)', cursor: 'pointer', fontFamily: 'JetBrains Mono',
              fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em'
            }}
          >Cancelar</button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            style={{
              padding: '10px 24px', background: 'var(--purple)', border: 'none', borderRadius: '4px',
              color: '#fff', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: '12px',
              fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: (loading || !name.trim()) ? 0.5 : 1
            }}
          >{loading ? 'Creando...' : 'Crear Equipo'}</button>
        </div>
      </div>
    </div>
  );
}
