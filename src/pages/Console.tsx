import { useState, useEffect, useCallback, useRef } from 'react';

import { usePageMotion } from '../components/usePageMotion';
import { Plus, FolderOpen, Settings, Play, MoreVertical, Trash2, Copy, Pencil, Upload, Cloud, CloudOff, X, Check, Users, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../types/supabase';
import { NotificationsMenu } from '../components/NotificationsMenu';
import { CreateTeamModal } from '../components/CreateTeamModal';
import { InviteUserModal } from '../components/InviteUserModal';

export function Console() {
  const pageRef = usePageMotion();
  const { user, profile, signOut } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'personal' | 'shared' | 'teams'>('personal');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isFetchingRef = useRef(false);

  // Project management state
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importingFile, setImportingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [inviteContext, setInviteContext] = useState<{ type: 'team' | 'project', id: string, name: string } | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const { data: memberships, error: memberErr } = await supabase
        .from('workspace_members')
        .select('workspace_id, workspaces(created_by, category)')
        .eq('user_id', user.id);

      if (memberErr || !memberships || memberships.length === 0) {
        console.warn('[Console] No workspaces found or error:', memberErr?.message);
        setProjects([]);
        setWorkspaces([]);
        return;
      }

      const workspaceMap = new Map();
      memberships.forEach((m: any) => {
        if (m.workspaces) {
          workspaceMap.set(m.workspace_id, m.workspaces);
        }
      });
      setWorkspaces(Array.from(workspaceMap.entries()).map(([id, w]) => ({ id, ...w })));

      const workspaceIds = memberships.map(m => m.workspace_id);

      if (workspaceIds.length === 0) {
        setProjects([]);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .in('workspace_id', workspaceIds)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setProjects(data);
      } else if (error) {
        console.error('[Console] Error fetching projects:', error.message);
      }
    } catch (err) {
      console.error('[Console] Error fetching projects:', err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    if (user) {
      fetchProjects().then(() => {
        if (!mounted) return;
        setLoading(false);
      });
    } else {
      if (mounted) setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [user, fetchProjects]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => setContextMenuId(null);
    if (contextMenuId) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenuId]);

  const handleOpenDaw = async (e?: React.MouseEvent, projectId?: string) => {
    if (e) e.preventDefault();
    const isPlayApp = window.location.hostname.startsWith('play.') || window.location.hostname.startsWith('console.');

    let urlSuffix = '/engine';
    if (projectId) {
      urlSuffix += `?project=${projectId}`;
    }

    if (isPlayApp) {
      navigate(urlSuffix);
    } else {
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        if (activeSession?.access_token && activeSession?.refresh_token) {
          const params = new URLSearchParams({
            access_token: activeSession.access_token,
            refresh_token: activeSession.refresh_token,
            token_type: 'bearer',
          });
          window.location.href = `https://play.hollowbits.com${urlSuffix}#${params.toString()}`;
        } else {
          window.location.href = `https://play.hollowbits.com${urlSuffix}`;
        }
      } catch {
        window.location.href = `https://play.hollowbits.com${urlSuffix}`;
      }
    }
  };

  const createProject = async () => {
    if (!user) return;

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

    try {
      const { data, error } = await supabase.rpc('create_project_with_limit', {
        p_name: 'Nuevo Proyecto',
        p_workspace_id: workspaceId,
        p_bpm: 120,
        p_sample_rate: 44100,
        p_is_public: false
      });

      if (error) {
        if (error.message.includes('limit reached')) {
          alert('Has alcanzado el límite de proyectos para la capa gratuita. Por favor actualiza tu plan o elimina un proyecto.');
        } else {
          console.error('[Console] Error creating project:', error);
        }
        return;
      }

      if (data) {
        handleOpenDaw(undefined, data as string);
      }
    } catch (err) {
      console.error('[Console] Exception creating project:', err);
    }
  };

  // --- RENAME ---
  const startRename = (project: Project) => {
    setRenamingId(project.id);
    setRenameValue(project.name);
    setContextMenuId(null);
  };

  const confirmRename = async () => {
    if (!renamingId || !renameValue.trim()) return;
    const { error } = await supabase
      .from('projects')
      .update({ name: renameValue.trim(), updated_at: new Date().toISOString() })
      .eq('id', renamingId);

    if (!error) {
      setProjects(prev => prev.map(p => p.id === renamingId ? { ...p, name: renameValue.trim() } : p));
    }
    setRenamingId(null);
  };

  // --- DELETE ---
  const confirmDelete = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
    setDeleteConfirmId(null);
  };

  // --- DUPLICATE ---
  const duplicateProject = async (project: Project) => {
    if (!user) return;
    setContextMenuId(null);

    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1);

    if (!memberships || memberships.length === 0) return;

    const { data, error } = await supabase
      .from('projects')
      .insert([{
        name: `${project.name} (Copia)`,
        workspace_id: memberships[0].workspace_id,
        bpm: project.bpm,
        sample_rate: project.sample_rate,
        data: (project as any).data || {}
      }])
      .select();

    if (!error && data) {
      setProjects(prev => [...data, ...prev]);
    }
  };

  // --- IMPORT LOCAL .esp ---
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setImportingFile(true);
    try {
      const text = await file.text();
      const projectData = JSON.parse(text);

      const { data: memberships } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1);

      if (!memberships || memberships.length === 0) throw new Error('No workspace');

      const projectName = projectData.name || file.name.replace(/\.esp$/i, '') || 'Proyecto Importado';

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: projectName,
          workspace_id: memberships[0].workspace_id,
          bpm: projectData.bpm || 124,
          sample_rate: projectData.sampleRate || 44100,
          data: projectData
        }])
        .select();

      if (!error && data) {
        setProjects(prev => [...data, ...prev]);
      }
    } catch (err) {
      console.error('[Console] Import error:', err);
      alert('Error al importar el archivo. Verifica que sea un archivo .esp válido.');
    } finally {
      setImportingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = profile?.username || profile?.full_name || user?.email || 'Usuario';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHrs < 24) return `Hace ${diffHrs}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="page-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Cargando consola...
      </div>
    );
  }

  return (
    <div className="page-shell" ref={pageRef} style={{ paddingTop: '120px' }}>
      {showCreateTeam && (
        <CreateTeamModal 
          onClose={() => setShowCreateTeam(false)} 
          onSuccess={() => { setShowCreateTeam(false); fetchProjects(); }} 
        />
      )}

      {inviteContext && (
        <InviteUserModal 
          onClose={() => setInviteContext(null)} 
          teamId={inviteContext.type === 'team' ? inviteContext.id : undefined}
          projectId={inviteContext.type === 'project' ? inviteContext.id : undefined}
          contextName={inviteContext.name}
        />
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".esp,.json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      {/* Delete confirmation overlay */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
            padding: '32px', maxWidth: '420px', width: '90%', textAlign: 'center'
          }}>
            <Trash2 size={32} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '1.2rem', marginBottom: '8px' }}>¿Eliminar este proyecto?</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Esta acción es irreversible. Todos los datos del proyecto serán eliminados permanentemente.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: '10px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                  borderRadius: '4px', color: 'var(--text)', cursor: 'pointer', fontFamily: 'JetBrains Mono',
                  fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >Cancelar</button>
              <button
                onClick={() => confirmDelete(deleteConfirmId)}
                style={{
                  padding: '10px 24px', background: '#ef4444', border: 'none', borderRadius: '4px',
                  color: '#fff', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: '12px',
                  fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <section className="dashboard" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} style={{
                width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover',
                border: '2px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }} />
            ) : (
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-2)', fontSize: '24px', fontWeight: 'bold'
              }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '2rem', marginBottom: '4px', lineHeight: 1 }}>Motor de Creación</h1>
              <p style={{ color: 'var(--text-2)', margin: 0 }}>
                Bienvenido, <strong>{displayName}</strong>
                {profile?.tier && profile.tier !== 'free' && (
                  <span style={{
                    marginLeft: '8px', padding: '2px 8px', background: 'rgba(168,85,247,0.15)',
                    border: '1px solid rgba(168,85,247,0.3)', borderRadius: '4px', fontSize: '11px',
                    fontFamily: 'JetBrains Mono', color: 'var(--purple)', textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {profile.tier}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <NotificationsMenu />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importingFile}
              style={{
                background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)',
                border: '1px solid var(--border)', padding: '12px 20px', borderRadius: '2px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold',
                fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', fontSize: '12px',
                letterSpacing: '0.05em', opacity: importingFile ? 0.5 : 1
              }}
            >
              <Upload size={14} /> {importingFile ? 'Importando...' : 'Importar .esp'}
            </button>
            <a
              href="https://play.hollowbits.com/engine"
              onClick={handleOpenDaw}
              style={{
                background: 'rgba(255,255,255,0.05)', color: 'var(--text)',
                border: '1px solid var(--border)', padding: '12px 24px', borderRadius: '2px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold',
                fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', fontSize: '13px',
                letterSpacing: '0.05em', textDecoration: 'none'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.background = 'rgba(168,85,247,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              <Play size={16} /> Abrir Motor DAW
            </a>
            <button
              onClick={createProject}
              style={{
                background: 'var(--text)', color: 'var(--bg)', border: 'none', padding: '12px 24px',
                borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase',
                fontSize: '13px', letterSpacing: '0.05em'
              }}
            >
              <Plus size={18} /> Nuevo Proyecto
            </button>
            {activeTab === 'teams' && (
              <button
                onClick={() => setShowCreateTeam(true)}
                style={{
                  background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid var(--purple)', padding: '12px 24px',
                  borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase',
                  fontSize: '13px', letterSpacing: '0.05em'
                }}
              >
                <Cloud size={18} /> Crear Equipo
              </button>
            )}
            <button
              onClick={() => navigate('/settings')}
              title="Configuración de la cuenta"
              style={{
                background: 'var(--glass)', color: 'var(--text-2)', border: '1px solid var(--border)',
                padding: '12px', borderRadius: '2px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', transition: 'all 0.2s ease',
              }}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
          {[
            { id: 'personal', label: 'Mis Proyectos', icon: <FolderOpen size={16} /> },
            { id: 'shared', label: 'Colaborativos', icon: <Users size={16} /> },
            { id: 'teams', label: 'Equipos', icon: <Cloud size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: 'none', border: 'none', color: activeTab === tab.id ? 'var(--text)' : 'var(--text-3)',
                padding: '0 0 12px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                fontFamily: 'Plus Jakarta Sans', fontSize: '1rem', fontWeight: activeTab === tab.id ? '600' : '400',
                borderBottom: activeTab === tab.id ? '2px solid var(--purple)' : '2px solid transparent',
                transition: 'all 0.2s ease', position: 'relative', top: '1px'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Project Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {(() => {
            let filteredProjects = [];
            if (activeTab === 'personal') {
              const myWsIds = workspaces.filter(w => w.created_by === user?.id && (!w.category || w.category === 'General')).map(w => w.id);
              filteredProjects = projects.filter(p => myWsIds.includes(p.workspace_id));
            } else if (activeTab === 'shared') {
              const sharedWsIds = workspaces.filter(w => w.created_by !== user?.id && (!w.category || w.category === 'General')).map(w => w.id);
              filteredProjects = projects.filter(p => sharedWsIds.includes(p.workspace_id));
            } else {
              const teamWsIds = workspaces.filter(w => w.category && w.category !== 'General').map(w => w.id);
              filteredProjects = projects.filter(p => teamWsIds.includes(p.workspace_id));
            }

            if (filteredProjects.length === 0) {
              return (
                <div style={{
                  padding: '60px', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: '12px', textAlign: 'center', gridColumn: '1 / -1',
                }}>
                  <Cloud size={40} style={{ color: 'var(--text-3)', margin: '0 auto 16px', opacity: 0.4 }} />
                  <p style={{ color: 'var(--text-2)', marginBottom: '16px' }}>No hay proyectos en esta sección.</p>
                  {activeTab === 'personal' && (
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button
                        onClick={createProject}
                        style={{
                          background: 'transparent', color: 'var(--purple)', border: '1px solid var(--border)',
                          padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                          display: 'inline-flex', alignItems: 'center', gap: '8px',
                        }}
                      >
                        <Plus size={16} /> Crear tu primer proyecto
                      </button>
                    </div>
                  )}
                  {activeTab === 'teams' && (
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button
                        onClick={() => setShowCreateTeam(true)}
                        style={{
                          background: 'transparent', color: 'var(--purple)', border: '1px solid var(--border)',
                          padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                          display: 'inline-flex', alignItems: 'center', gap: '8px',
                        }}
                      >
                        <Cloud size={16} /> Crear tu primer equipo
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return filteredProjects.map(p => (
              <div
                key={p.id}
                style={{
                  background: 'rgba(10, 10, 10, 0.8)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '2px',
                  padding: '24px', transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden'
                }}
                onClick={(e) => {
                  if (renamingId === p.id || deleteConfirmId === p.id) return;
                  handleOpenDaw(e, p.id);
                }}
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
                {/* Top row: icon + name + context menu */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(168,85,247,0.1)', padding: '12px', borderRadius: '8px', color: 'var(--purple)' }}>
                    <FolderOpen size={24} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {renamingId === p.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenamingId(null); }}
                          style={{
                            fontFamily: 'Plus Jakarta Sans', fontSize: '1.1rem', background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(168,85,247,0.5)', borderRadius: '4px', padding: '4px 8px',
                            color: 'var(--text)', outline: 'none', width: '100%'
                          }}
                        />
                        <button onClick={confirmRename} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', padding: '4px' }}>
                          <Check size={16} />
                        </button>
                        <button onClick={() => setRenamingId(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '1.2rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h3>
                    )}
                  </div>

                  {/* Context menu trigger */}
                  <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setContextMenuId(contextMenuId === p.id ? null : p.id); }}
                      style={{
                        background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer',
                        padding: '4px', borderRadius: '4px', transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'none'; }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {contextMenuId === p.id && (
                      <div style={{
                        position: 'absolute', right: 0, top: '100%', marginTop: '4px', width: '180px',
                        background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden'
                      }}>
                        {[
                          { icon: <UserPlus size={13} />, label: 'Invitar', action: () => { setInviteContext({ type: 'project', id: p.id, name: p.name }); setContextMenuId(null); } },
                          { icon: <Pencil size={13} />, label: 'Renombrar', action: () => startRename(p) },
                          { icon: <Copy size={13} />, label: 'Duplicar', action: () => duplicateProject(p) },
                          { icon: <Trash2 size={13} />, label: 'Eliminar', action: () => { setDeleteConfirmId(p.id); setContextMenuId(null); }, danger: true },
                        ].map((item, i) => (
                          <button
                            key={i}
                            onClick={item.action}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
                              color: item.danger ? '#ef4444' : 'var(--text)', fontSize: '13px',
                              fontFamily: 'Inter, sans-serif', textAlign: 'left', transition: 'background 0.1s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            {item.icon} {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom row: metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cloud size={11} style={{ color: 'rgba(168,85,247,0.6)' }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontFamily: 'JetBrains Mono', margin: 0 }}>
                      {formatDate(p.updated_at)}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--text-3)',
                    background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px',
                  }}>
                    {p.bpm} BPM · {(p.sample_rate / 1000).toFixed(1)}kHz
                  </span>
                </div>
              </div>
            ));
          })()}
        </div>
      </section>
    </div>
  );
}
