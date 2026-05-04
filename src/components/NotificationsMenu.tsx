import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export type Notification = {
  id: string;
  type: string;
  status: string;
  project_id: string | null;
  team_id: string | null;
  message: string | null;
  created_at: string | null;
  sender_id: string | null;
};

export function NotificationsMenu() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    fetchNotifications();

    const channel = supabase
      .channel('public:user_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const handleResponse = async (id: string, status: 'accepted' | 'declined', notif: Notification) => {
    // 1. Update notification status
    await supabase.from('user_notifications').update({ status }).eq('id', id);
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, status } : n));

    if (status === 'accepted') {
      if (notif.type === 'project_invite' && notif.project_id) {
        // Add to project shares (this is a simplified logic, actual project_shares requires token generation or direct insertion if allowed)
        await supabase.from('project_shares').insert({
          project_id: notif.project_id,
          access_level: 'editor', // Or read from metadata
          invited_email: user?.email,
          token: crypto.randomUUID()
        });
      } else if (notif.type === 'team_invite' && notif.team_id) {
        await supabase.from('workspace_members').insert({
          workspace_id: notif.team_id,
          user_id: user!.id,
          role: 'editor'
        });
      }
    }
  };

  const pendingCount = notifications.filter(n => n.status === 'pending').length;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
      >
        <Bell className="w-5 h-5 text-gray-400 hover:text-white" />
        {pendingCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-zinc-950"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
            <span className="text-xs text-gray-500">{pendingCount} pendientes</span>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 transition-colors ${notif.status === 'pending' ? 'bg-zinc-800/20' : 'opacity-60'}`}>
                    <p className="text-sm text-gray-300 mb-2">{notif.message}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : ''}
                      </span>
                      {notif.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleResponse(notif.id, 'declined', notif)}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                            title="Rechazar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleResponse(notif.id, 'accepted', notif)}
                            className="p-1.5 rounded-md hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 transition-colors"
                            title="Aceptar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          notif.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {notif.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
