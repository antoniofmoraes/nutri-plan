import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { GoogleLinkDialog } from './GoogleLinkDialog';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

export function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);
  const [linkData, setLinkData] = useState<{ accessToken: string; email: string } | null>(null);
  const { setUserFromResponse } = useAuth();
  const navigate = useNavigate();
  const clientRef = useRef<google.accounts.oauth2.TokenClient | null>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const tryInit = () => {
      if (!window.google?.accounts?.oauth2) return false;

      clientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: () => {},
      });
      return true;
    };

    if (!tryInit()) {
      const interval = setInterval(() => {
        if (tryInit()) clearInterval(interval);
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!clientRef.current) {
      toast.error('Google Sign-In ainda carregando. Tente novamente.');
      return;
    }

    setLoading(true);

    clientRef.current.callback = async (tokenResponse) => {
      if (tokenResponse.error) {
        setLoading(false);
        if (tokenResponse.error !== 'user_cancelled') {
          toast.error('Erro ao conectar com Google');
        }
        return;
      }

      try {
        const result = await authService.googleAuth(tokenResponse.access_token);

        if (result.status === 'authenticated') {
          setUserFromResponse({ user: result.user, token: result.token });
          toast.success('Bem-vindo!');
          navigate('/');
        } else if (result.status === 'needs_linking') {
          setLinkData({ accessToken: tokenResponse.access_token, email: result.email });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao fazer login com Google';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    clientRef.current.requestAccessToken();
  }, [setUserFromResponse, navigate]);

  const handleLinkSuccess = useCallback(() => {
    setLinkData(null);
    toast.success('Conta vinculada com sucesso!');
    navigate('/');
  }, [navigate]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex items-center justify-center gap-3 w-full h-11 rounded-lg border border-border bg-background text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continuar com Google
      </button>

      {linkData && (
        <GoogleLinkDialog
          email={linkData.email}
          accessToken={linkData.accessToken}
          onSuccess={handleLinkSuccess}
          onCancel={() => setLinkData(null)}
        />
      )}
    </>
  );
}
