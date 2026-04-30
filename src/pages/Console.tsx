import { useState, useEffect } from 'react';


import { usePageMotion } from '../components/usePageMotion';
import { Plus, FolderOpen, LogOut } from 'lucide-react';
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
    if (user) fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setProjects(data);
    setLoading(false);
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
            <button
              onClick={createProject}
              style={{
                background: 'var(--purple)',
                color: 'var(--text)',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 'bold',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Plus size={18} /> Nuevo Proyecto
            </button>
            <button
              onClick={handleSignOut}
              title="Cerrar sesión"
              style={{
                background: 'var(--glass)',
                color: 'var(--text-2)',
                border: '1px solid var(--border)',
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <LogOut size={18} />
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
                  background: 'var(--glass)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '24px',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/engine')}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--purple)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
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
