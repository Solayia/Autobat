import { useState, useEffect, useRef } from 'react';
import { Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';

function formatMessageTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return `Hier ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
      ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}

function Avatar({ user }) {
  if (user.avatar_url) {
    return <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />;
  }
  const initials = `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase();
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-rose-500'];
  const color = colors[(user.prenom?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

export default function DiscussionTab({ chantierId }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const loadMessages = async () => {
    try {
      const res = await api.get(`/chantiers/${chantierId}/messages`);
      setMessages(res.data);
    } catch {
      toast.error('Erreur chargement discussion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 15000); // Rafraîchissement toutes les 15s
    return () => clearInterval(interval);
  }, [chantierId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      const res = await api.post(`/chantiers/${chantierId}/messages`, { message: text.trim() });
      setMessages(prev => [...prev, res.data]);
      setText('');
      textareaRef.current?.focus();
    } catch {
      toast.error('Erreur envoi message');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await api.delete(`/chantiers/${chantierId}/messages/${messageId}`);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch {
      toast.error('Erreur suppression message');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canDelete = (msg) => {
    return msg.user_id === user?.id || ['MANAGER', 'COMPANY_ADMIN'].includes(user?.role);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-320px)] min-h-[400px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 py-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Send className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucun message pour l'instant</p>
            <p className="text-gray-400 text-sm mt-1">Commencez la discussion sur ce chantier</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.user_id === user?.id;
            const prevMsg = messages[idx - 1];
            const sameAuthor = prevMsg?.user_id === msg.user_id;
            const showHeader = !sameAuthor;

            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                {/* Avatar — masqué si même auteur que le message précédent */}
                <div className="flex-shrink-0 mt-1">
                  {showHeader ? <Avatar user={msg.user} /> : <div className="w-8" />}
                </div>

                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {showHeader && (
                    <span className="text-xs text-gray-500 mb-1 px-1">
                      {msg.user.prenom} {msg.user.nom}
                    </span>
                  )}
                  <div className="group relative">
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                        isMe
                          ? 'bg-green-600 text-white rounded-tr-sm'
                          : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm shadow-sm'
                      }`}
                    >
                      {msg.message}
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs text-gray-400">{formatMessageTime(msg.created_at)}</span>
                      {canDelete(msg) && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 pt-4 mt-2">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message… (Entrée pour envoyer)"
            rows={1}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm leading-relaxed"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="p-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-1.5 px-1">Shift+Entrée pour aller à la ligne</p>
      </div>
    </div>
  );
}
