import { useState, useEffect } from 'react';


import { usePageMotion } from '../components/usePageMotion';
import { Plus, FolderOpen, Settings, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../types/supabase';



export function Console() {
  const pageRef = usePageMotion();
  const { user, profile, signOut } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      // If there's no user (e.g. session expired), stop loading
      setLoading(false);
    }
  }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // First, get workspace IDs the user belongs to
      const { data: memberships, error: memberErr } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user!.id);

      if (memberErr || !memberships || memberships.length === 0) {
        console.warn('[Console] No workspaces found or error:', memberErr?.message);
        setProjects([]);
        return;
      }

      const workspaceIds = memberships.map(m => m.workspace_id);

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .in('workspace_id', workspaceIds)
        .order('created_at', { ascending: false });

      if (!error && data) setProjects(data);
      else if (error) console.error('[Console] Error fetching projects:', error.message);
    } catch (err) {
      console.error('[Console] Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDaw = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const isPlayApp = window.location.hostname.startsWith('play.') || window.location.hostname.startsWith('console.');
    
    if (isPlayApp) {
      navigate('/engine');
    } else {
      // Usamos el sistema de Cookies SSO nativo (ssoStorage) configurado en supabase.ts
      // Ya no necesitamos inyectar tokens frágiles en la URL
      window.location.href = 'https://play.hollowbits.com/engine';
    }
  };

  const createProject = async () => {
    if (!user) return;

    // Fetch user's first workspace to create project in
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1);

    if (!memberships || memberships.length === 0) {
      console.error('[Console] No workspace found for user');
      return;
    }

    const workspaceId = memberships[0].workspace_id;

    const { data, error } = await supabase
      .from('projects')
      .insert([{ name: 'Nuevo Proyecto', workspace_id: workspaceId }])
      .select();

    if (!error && data) {
      setProjects([...data, ...projects]);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = profile?.username || profile?.full_name || user?.email || 'Usuario';

  if (loading) {
    return (
      <div className="page-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Cargando consola...
      </div>
    );
  }

  return (
    <div className="page-shell" ref={pageRef} style={{ paddingTop: '120px' }}>
      <section className="dashboard" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '2rem', marginBottom: '8px' }}>Mis Proyectos</h1>
            <p style={{ color: 'var(--text-2)' }}>
              Bienvenido, <strong>{displayName}</strong>
              {profile?.tier && profile.tier !== 'free' && (
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  background: 'rgba(168,85,247,0.15)',
                  border: '1px solid rgba(168,85,247,0.3)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono',
                  color: 'var(--purple)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {profile.tier}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a
              href="https://play.hollowbits.com/engine"
              onClick={handleOpenDaw}
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                padding: '12px 24px',
                borderRadius: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 'bold',
                fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'uppercase',
                fontSize: '13px',
                letterSpacing: '0.05em',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--purple)';
                e.currentTarget.style.background = 'rgba(168,85,247,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
            >
              <Play size={16} /> Abrir Motor DAW
            </a>
            <button
              onClick={createProject}
              style={{
                background: 'var(--text)',
                color: 'var(--bg)',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 'bold',
                fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'uppercase',
                fontSize: '13px',
                letterSpacing: '0.05em'
              }}
            >
              <Plus size={18} /> Nuevo Proyecto
            </button>
            <button
              onClick={() => navigate('/settings')}
              title="Configuración de la cuenta"
              style={{
                background: 'var(--glass)',
                color: 'var(--text-2)',
                border: '1px solid var(--border)',
                padding: '12px',
                borderRadius: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {projects.length === 0 ? (
            <div style={{
              padding: '60px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              textAlign: 'center',
              gridColumn: '1 / -1',
            }}>
              <p style={{ color: 'var(--text-2)', marginBottom: '16px' }}>No tienes proyectos activos.</p>
              <button
                onClick={createProject}
                style={{
                  background: 'transparent',
                  color: 'var(--purple)',
                  border: '1px solid var(--border)',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Plus size={16} /> Crear tu primer proyecto
              </button>
            </div>
          ) : (
            projects.map(p => (
              <div
                key={p.id}
                style={{
                  background: 'rgba(10, 10, 10, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '2px',
                  padding: '24px',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={handleOpenDaw}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.5)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 20px rgba(168,85,247,0.15)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(168,85,247,0.1)', padding: '12px', borderRadius: '8px', color: 'var(--purple)' }}>
                    <FolderOpen size={24} />
                  </div>
                  <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '1.2rem', margin: 0 }}>{p.name}</h3>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', fontFamily: 'JetBrains Mono', margin: 0 }}>
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono',
                    color: 'var(--text-3)',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}>
                    {p.bpm} BPM · {(p.sample_rate / 1000).toFixed(1)}kHz
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
