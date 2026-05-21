import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GoogleLinkDialogProps {
  email: string;
  accessToken: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function GoogleLinkDialog({ email, accessToken, onSuccess, onCancel }: GoogleLinkDialogProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUserFromResponse } = useAuth();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password || loading) return;
    setLoading(true);

    try {
      const response = await authService.googleLink(accessToken, password);
      setUserFromResponse(response);
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao vincular conta';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular conta Google</DialogTitle>
          <DialogDescription>
            Já existe uma conta com o email <strong className="text-foreground">{email}</strong>.
            Digite sua senha para vincular o Google a esta conta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody>
            <div>
              <label className="label-mono">Senha</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted flex items-center">
                  <Lock size={16} strokeWidth={1.6} />
                </span>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-[38px]"
                  required
                  minLength={6}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                />
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={loading}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant="acc"
              disabled={loading || !password}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Vinculando…
                </>
              ) : (
                'Vincular conta'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
