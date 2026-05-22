import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, UtensilsCrossed, Check, X, ShieldCheck, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mealPlanShareService } from '@/services/mealPlanShareService';
import { toast } from 'sonner';
import type { InvitePreview } from '@/types';

const goalLabels: Record<string, string> = {
  emagrecer: 'Emagrecimento',
  manter: 'Manutenção',
  ganhar: 'Ganho de massa',
};

export default function PlanInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'preview' | 'accepting' | 'error'>('loading');
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const info = await mealPlanShareService.getInviteInfo(token);
        setInvite(info);
        setStatus('preview');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Convite inválido ou expirado');
      }
    })();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setStatus('accepting');
    try {
      const { planId } = await mealPlanShareService.acceptInvite(token);
      toast.success('Convite aceito!');
      navigate(`/planos/${planId}`);
    } catch (err) {
      setStatus('preview');
      toast.error(err instanceof Error ? err.message : 'Erro ao aceitar convite');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-card rounded-2xl shadow-medium p-8 flex flex-col items-center text-center max-w-md w-full space-y-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <X className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-xl font-display font-bold">Convite indisponível</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={() => navigate('/planos')}>Ir para meus planos</Button>
        </div>
      </div>
    );
  }

  if (!invite) return null;

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <div className="bg-card rounded-2xl shadow-medium p-8 max-w-md w-full space-y-6 animate-fade-in">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold text-primary">
              {invite.ownerName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">
              <span className="font-semibold text-foreground">{invite.ownerName}</span> convidou você para participar de um plano alimentar.
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">{invite.planName}</h3>
              <p className="text-muted-foreground text-sm">
                {goalLabels[invite.planGoal] ?? invite.planGoal} · {invite.dailyCalories} kcal · {invite.slotCount} {invite.slotCount === 1 ? 'refeição' : 'refeições'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
          {invite.canEdit ? (
            <>
              <ShieldCheck className="h-5 w-5 text-success flex-shrink-0" />
              <span className="text-sm">Você poderá <span className="font-medium">editar</span> o plano</span>
            </>
          ) : (
            <>
              <ShieldOff className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">Acesso <span className="font-medium">somente leitura</span></span>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            onClick={handleAccept}
            disabled={status === 'accepting'}
            className="flex-1"
          >
            {status === 'accepting' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Aceitando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Aceitar convite
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/planos')}
            disabled={status === 'accepting'}
            className="flex-1"
          >
            Recusar
          </Button>
        </div>
      </div>
    </div>
  );
}
