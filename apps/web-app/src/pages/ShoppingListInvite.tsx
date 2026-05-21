import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shoppingListService } from '@/services/shoppingListService';

export default function ShoppingListInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const list = await shoppingListService.acceptInvite(token);
        setStatus('success');
        setTimeout(() => navigate(`/listas-compras/${list.id}`), 1200);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Erro ao aceitar convite');
      }
    })();
  }, [token, navigate]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="bg-surface border border-line rounded-lg shadow-1 p-12 flex flex-col items-center text-center max-w-md w-full space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-muted text-[13.5px]">Aceitando convite...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <p className="text-[19px] font-semibold">Convite aceito!</p>
            <p className="text-muted text-[13.5px]">Redirecionando para a lista...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-[19px] font-semibold text-danger">Não foi possível aceitar</p>
            <p className="text-muted text-[13.5px]">{error}</p>
            <Button variant="acc" onClick={() => navigate('/listas-compras')}>Ir para minhas listas</Button>
          </>
        )}
      </div>
    </div>
  );
}
