import { useEffect, useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Engine() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate engine loading time
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
          <Loader2 size={48} className="animate-spin" style={{ color: 'var(--purple)' }} />
          <h2 style={{ fontFamily: 'JetBrains Mono', color: 'var(--text)', fontSize: '14px', letterSpacing: '0.1em' }}>
            INICIALIZANDO MOTOR DE AUDIO NATIVO...
          </h2>
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <button 
            onClick={() => navigate('/console')}
            style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, background: 'var(--glass)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '8px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
          >
            <ArrowLeft size={16} /> Volver a Consola
          </button>
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              backgroundImage: 'url(/daw-screenshot-real.png)', 
              backgroundSize: 'cover', 
              backgroundPosition: 'center',
              boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)'
            }} 
          />
        </div>
      )}
    </div>
  );
}
