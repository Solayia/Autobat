import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

/**
 * Page de callback OAuth2 Gmail.
 * Google redirige ici après que l'utilisateur a autorisé l'accès.
 * Cette page appelle le backend pour échanger le code contre les tokens.
 */
export default function GmailCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      navigate(`/settings?tab=email&gmail=error&msg=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (!code || !state) {
      navigate('/settings?tab=email&gmail=error&msg=missing_params', { replace: true });
      return;
    }

    api.post('/settings/gmail/exchange', { code, state })
      .then(() => {
        navigate('/settings?tab=email&gmail=success', { replace: true });
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Erreur lors de la connexion Gmail';
        setStatus('error');
        setMessage(msg);
        setTimeout(() => {
          navigate(`/settings?tab=email&gmail=error&msg=${encodeURIComponent(msg)}`, { replace: true });
        }, 2000);
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Connexion Gmail en cours...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-500 text-4xl mb-4">✗</div>
            <p className="text-gray-800 font-medium">{message}</p>
            <p className="text-gray-500 text-sm mt-1">Redirection...</p>
          </>
        )}
      </div>
    </div>
  );
}
