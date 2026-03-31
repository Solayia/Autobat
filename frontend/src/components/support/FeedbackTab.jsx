import { useState, useRef } from 'react';
import { Camera, Paperclip, X, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TYPES = [
  { value: 'BUG', label: '🐛 Bug', desc: 'Quelque chose ne fonctionne pas' },
  { value: 'FEEDBACK', label: '💬 Amélioration', desc: 'Amélioration UX / retour' },
  { value: 'QUESTION', label: '❓ Question', desc: 'J\'ai besoin d\'aide' },
];

export default function FeedbackTab({ pageContext }) {
  const [type, setType] = useState('BUG');
  const [titre, setTitre] = useState('');
  const [message, setMessage] = useState('');
  const [priorite] = useState('MEDIUM');
  const [screenshot, setScreenshot] = useState(null); // base64
  const [attachments, setAttachments] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const fileRef = useRef(null);

  const captureScreen = async () => {
    setCapturing(true);
    try {
      // html2canvas — import dynamique pour ne pas alourdir le bundle si non utilisé
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(document.body, { useCORS: true, scale: 0.75 });
      setScreenshot(canvas.toDataURL('image/png'));
    } catch {
      toast.error('Capture impossible sur ce navigateur');
    } finally {
      setCapturing(false);
    }
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (valid.length < files.length) toast.error('Fichiers > 10 Mo ignorés');
    setAttachments(prev => [...prev, ...valid].slice(0, 5));
  };

  const removeAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titre.trim() || !message.trim()) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('titre', titre.trim());
      formData.append('message', message.trim());
      formData.append('priorite', priorite);
      if (pageContext?.url) formData.append('page_url', pageContext.url);
      if (pageContext?.entity) formData.append('entity_name', pageContext.entity);
      if (screenshot) formData.append('screenshot_data', screenshot);
      attachments.forEach(f => formData.append('attachments', f));

      await api.post('/support/tickets', formData);

      setSent(true);
    } catch {
      toast.error('Erreur lors de l\'envoi, réessayez');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-3">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <p className="font-semibold text-gray-800">Message envoyé !</p>
        <p className="text-sm text-gray-500">Notre équipe va traiter votre demande rapidement.</p>
        <button
          onClick={() => { setSent(false); setTitre(''); setMessage(''); setScreenshot(null); setAttachments([]); }}
          className="mt-2 text-sm text-primary-600 hover:underline"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full gap-3">
      {/* Type */}
      <div className="grid grid-cols-3 gap-1.5">
        {TYPES.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`flex flex-col items-center p-2 rounded-lg border text-xs transition-all ${
              type === t.value
                ? 'border-primary-400 bg-primary-50 text-primary-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <span className="text-base">{t.label.split(' ')[0]}</span>
            <span className="font-medium mt-0.5">{t.label.split(' ').slice(1).join(' ')}</span>
          </button>
        ))}
      </div>

      {/* Titre */}
      <input
        type="text"
        value={titre}
        onChange={e => setTitre(e.target.value)}
        placeholder="Titre court *"
        required
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
      />

      {/* Message */}
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder={type === 'BUG'
          ? 'Décrivez le bug : ce que vous faisiez, ce qui s\'est passé, les étapes pour reproduire…'
          : 'Votre message…'
        }
        required
        rows={4}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
      />


      {/* Contexte page */}
      {(pageContext?.url || pageContext?.entity) && (
        <p className="text-xs text-gray-400 bg-gray-50 rounded px-2 py-1">
          📍 {pageContext.entity ? `${pageContext.entity} — ` : ''}{pageContext.url}
        </p>
      )}

      {/* Screenshot */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={captureScreen}
            disabled={capturing}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-gray-300 transition-all disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            {capturing ? 'Capture…' : screenshot ? 'Recapturer' : 'Capturer l\'écran'}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-gray-300 transition-all"
          >
            <Paperclip className="w-3.5 h-3.5" />
            Ajouter fichier
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleFiles} />
        </div>

        {screenshot && (
          <div className="relative inline-block">
            <img src={screenshot} alt="screenshot" className="h-16 rounded border border-gray-200 object-cover" />
            <button
              type="button"
              onClick={() => setScreenshot(null)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {attachments.map((f, i) => (
              <div key={i} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                <span className="max-w-[120px] truncate">{f.name}</span>
                <button type="button" onClick={() => removeAttachment(i)}>
                  <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={sending || !titre.trim() || !message.trim()}
        className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-semibold text-sm rounded-lg transition-colors"
      >
        <Send className="w-4 h-4" />
        {sending ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  );
}
