import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
      <Card className="max-w-md w-full">
        <CardContent className="py-10 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Aceitando convite...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <p className="text-lg font-semibold font-display">Convite aceito!</p>
              <p className="text-muted-foreground text-sm">Redirecionando para a lista...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <p className="text-lg font-semibold font-display text-destructive">Não foi possível aceitar</p>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button onClick={() => navigate('/listas-compras')}>Ir para minhas listas</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
