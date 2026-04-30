import { useState, useEffect } from 'react';
import { consoleFeatures } from '../content';
import { Btn, SectionHeader } from '../components/Editorial';
import { usePageMotion } from '../components/usePageMotion';
import { Globe, Link as LinkIcon, Cloud, Shield, Monitor, Plus, FolderOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

const iconMap: Record<string, React.ElementType> = { Globe, Link: LinkIcon, Cloud, Shield };

export function Console() {
  const pageRef = usePageMotion();
  const [session, setSession] = useState<Session | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProjects();
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProjects();
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (!error && data) setProjects(data);
    setLoading(false);
  };

  const createProject = async () => {
    if (!session) return;
    const { data, error } = await supabase.from('projects').insert([
      { title: 'New Project', owner_id: session.user.id }
    ]).select();
    if (!error && data) {
      setProjects([...data, ...projects]);
    }
  };

  if (loading) {
    return <div className="page-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando consola...</div>;
  }

  if (session) {
    return (
      <div className="page-shell" ref={pageRef} style={{ paddingTop: '120px' }}>
        <section className="dashboard" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div>
              <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '2rem', marginBottom: '8px' }}>Mis Proyectos</h1>
              <p style={{ color: 'var(--text-2)' }}>Bienvenido a tu consola, {session.user.email}</p>
            </div>
            <button 
              onClick={createProject}
              style={{ background: 'var(--purple)', color: 'var(--text)', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
            >
              <Plus size={18} /> Nuevo Proyecto
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {projects.length === 0 ? (
              <div style={{ padding: '60px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center', gridColumn: '1 / -1' }}>
                <p style={{ color: 'var(--text-2)' }}>No tienes proyectos activos.</p>
              </div>
            ) : (
              projects.map(p => (
                <div key={p.id} style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', transition: 'transform 0.2s ease', cursor: 'pointer' }} onClick={() => navigate('/engine')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(168,85,247,0.1)', padding: '12px', borderRadius: '8px', color: 'var(--purple)' }}>
                      <FolderOpen size={24} />
                    </div>
                    <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '1.2rem', margin: 0 }}>{p.title}</h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', fontFamily: 'JetBrains Mono' }}>
                    Creado: {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell" ref={pageRef}>
      <section className="hero" style={{ minHeight: 'auto', paddingBottom: '2rem' }} data-page-hero>
        <div className="hero__badge"><span className="hero__badge-dot" /> Web Console</div>
        <h1 className="hero__title" style={{ fontSize: 'clamp(2.8rem,6vw,5rem)' }}>
          Tu estudio completo<br />en el navegador.
        </h1>
        <p className="hero__subtitle">
          Inicia sesión y abre HOLLOW BITS directamente en tu navegador.
          El mismo motor, la misma interfaz. Colabora en tiempo real compartiendo un enlace.
        </p>
        <div className="hero__actions">
          <Btn to="/login">Iniciar Sesión</Btn>
          <Btn to="/signup" variant="ghost">Crear Cuenta</Btn>
        </div>
      </section>

      <section className="console-section">
        <div className="console-preview">
          <div className="console-preview__info">
            <SectionHeader
              kicker="Cómo funciona"
              title={<>Regístrate. Abre.<br />Produce. Comparte.</>}
            />
            {consoleFeatures.map(f => {
              const Icon = iconMap[f.icon] || Monitor;
              return (
                <div className="console-preview__feature" key={f.title}>
                  <div className="console-preview__feature-icon"><Icon /></div>
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="daw-preview" data-reveal style={{ aspectRatio: '4/3', backgroundImage: 'url(/daw-screenshot-real.png)', backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--border)', borderRadius: '12px' }}>
            {/* The actual image now serves as the DAW preview */}
            <div className="daw-preview__shimmer" />
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-section__inner" data-reveal>
          <h2 className="cta-section__title">Colaboración sin fricciones.</h2>
          <p className="cta-section__desc">
            Comparte un enlace como en Canva. Cualquier persona con acceso puede editar tu proyecto en tiempo real.
            Sin instalaciones, sin configuración.
          </p>
          <Btn to="/signup">Únete ahora</Btn>
        </div>
      </section>
    </div>
  );
}
