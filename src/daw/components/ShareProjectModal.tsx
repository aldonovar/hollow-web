import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Link, Copy, Check, Trash2, X, Eye, Edit2 } from 'lucide-react';
import { ProjectShare } from '../../types/supabase';

interface ShareProjectModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export function ShareProjectModal({ projectId, projectName, onClose }: ShareProjectModalProps) {
  const { user } = useAuthStore();
  const [shares, setShares] = useState<ProjectShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchShares();
  }, [projectId]);

  const fetchShares = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('project_shares')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setShares(data);
    }
    setLoading(false);
  };

  const createShare = async (accessLevel: 'viewer' | 'editor') => {
    if (!user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('project_shares')
      .insert({
        project_id: projectId,
        access_level: accessLevel,
        created_by: user.id
      })
      .select()
      .single();

    if (!error && data) {
      setShares([data, ...shares]);
    }
    setCreating(false);
  };

  const deleteShare = async (id: string) => {
    const { error } = await supabase
      .from('project_shares')
      .delete()
      .eq('id', id);

    if (!error) {
      setShares(shares.filter(s => s.id !== id));
    }
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/daw?project=${projectId}&token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Compartir Sesión</h2>
            <p className="text-xs text-gray-400 mt-0.5">{projectName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => createShare('viewer')}
              disabled={creating}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              <Eye size={16} className="text-blue-400" />
              <span>Link Visor</span>
            </button>
            <button
              onClick={() => createShare('editor')}
              disabled={creating}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              <Edit2 size={16} className="text-rose-400" />
              <span>Link Editor</span>
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Enlaces Activos</h3>
            
            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-white/20 border-t-purple-500 rounded-full animate-spin" />
              </div>
            ) : shares.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                No hay enlaces activos.
              </div>
            ) : (
              shares.map((share) => (
                <div key={share.id} className="group p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2 rounded-md ${share.access_level === 'editor' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {share.access_level === 'editor' ? <Edit2 size={14} /> : <Eye size={14} />}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-200 capitalize">{share.access_level}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5 truncate max-w-[120px] sm:max-w-[180px]">{share.token}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyLink(share.token)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                      title="Copiar Enlace"
                    >
                      {copiedToken === share.token ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={() => deleteShare(share.id)}
                      className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Revocar Enlace"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
