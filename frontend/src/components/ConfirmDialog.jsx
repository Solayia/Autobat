import { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * Modal de confirmation réutilisable.
 * Usage :
 *   const [confirm, setConfirm] = useState(null);
 *   setConfirm({ message: '...', onConfirm: () => doSomething(), danger: true, requireText: 'nom exact' });
 *   <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
 */
export default function ConfirmDialog({ confirm, onClose }) {
  const [inputText, setInputText] = useState('');

  if (!confirm) return null;

  const { title, message, confirmLabel = 'Confirmer', danger = false, onConfirm, requireText } = confirm;

  const handleConfirm = () => {
    onConfirm();
    onClose();
    setInputText('');
  };

  const isDisabled = requireText && inputText !== requireText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
            {danger ? (
              <Trash2 className="w-5 h-5 text-red-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {title && <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>}
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        {requireText && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-1.5">
              Tapez <strong className="text-gray-700 font-semibold">{requireText}</strong> pour confirmer :
            </p>
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              placeholder={requireText}
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!!isDisabled}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              danger
                ? isDisabled ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
