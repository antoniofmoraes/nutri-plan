import { useState } from 'react';
import { Share2, Copy, Check, Loader2, UserMinus, Link2Off, ShieldCheck, ShieldOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useMealPlanSharing } from '@/hooks/useMealPlans';
import { toast } from 'sonner';
import type { MealPlan } from '@/types';

interface ShareDialogProps {
  plan: MealPlan;
}

export function ShareDialog({ plan }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [copied, setCopied] = useState(false);
  const sharing = useMealPlanSharing(plan.id);

  const hasSharedUser = !!plan.sharedWith;
  const hasActiveInvite = !!plan.activeInvite;

  const handleGenerateInvite = async () => {
    try {
      await sharing.generateInvite(canEdit);
      toast.success('Convite gerado!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar convite');
    }
  };

  const handleCopyLink = async () => {
    if (!plan.activeInvite) return;
    const url = `${window.location.origin}${plan.activeInvite.inviteUrl}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevokeInvite = async () => {
    try {
      await sharing.revokeInvite();
      toast.success('Convite revogado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao revogar convite');
    }
  };

  const handleTogglePermission = async (value: boolean) => {
    try {
      await sharing.updatePermission(value);
      toast.success(value ? 'Edição habilitada' : 'Edição desabilitada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar permissão');
    }
  };

  const handleRemoveUser = async () => {
    try {
      await sharing.removeSharedUser();
      toast.success('Acesso removido');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover acesso');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Compartilhar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Compartilhar plano</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {hasSharedUser && plan.sharedWith ? (
            <SharedUserSection
              userName={plan.sharedWith.userName}
              canEdit={plan.sharedWith.canEdit}
              sharedAt={plan.sharedWith.sharedAt}
              onTogglePermission={handleTogglePermission}
              onRemove={handleRemoveUser}
            />
          ) : hasActiveInvite && plan.activeInvite ? (
            <PendingInviteSection
              inviteUrl={`${window.location.origin}${plan.activeInvite.inviteUrl}`}
              expiresAt={plan.activeInvite.expiresAt}
              canEdit={plan.activeInvite.canEdit}
              copied={copied}
              onCopy={handleCopyLink}
              onRevoke={handleRevokeInvite}
            />
          ) : (
            <GenerateInviteSection
              canEdit={canEdit}
              onCanEditChange={setCanEdit}
              onGenerate={handleGenerateInvite}
              isGenerating={sharing.isGenerating}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GenerateInviteSection({
  canEdit,
  onCanEditChange,
  onGenerate,
  isGenerating,
}: {
  canEdit: boolean;
  onCanEditChange: (v: boolean) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Gere um link de convite para compartilhar este plano com outra pessoa.
      </p>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          {canEdit ? (
            <ShieldCheck className="h-4 w-4 text-success" />
          ) : (
            <ShieldOff className="h-4 w-4 text-muted-foreground" />
          )}
          <Label htmlFor="can-edit" className="text-sm cursor-pointer">
            Pode editar o plano
          </Label>
        </div>
        <Switch id="can-edit" checked={canEdit} onCheckedChange={onCanEditChange} />
      </div>

      <Button onClick={onGenerate} disabled={isGenerating} className="w-full">
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando...
          </>
        ) : (
          'Gerar link de convite'
        )}
      </Button>
    </div>
  );
}

function PendingInviteSection({
  inviteUrl,
  expiresAt,
  canEdit,
  copied,
  onCopy,
  onRevoke,
}: {
  inviteUrl: string;
  expiresAt: Date;
  canEdit: boolean;
  copied: boolean;
  onCopy: () => void;
  onRevoke: () => void;
}) {
  const expiresLabel = formatRelativeDate(expiresAt);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Convite ativo. Compartilhe o link abaixo.
      </p>

      <div className="flex gap-2">
        <Input value={inviteUrl} readOnly className="text-xs" />
        <Button variant="outline" size="icon" onClick={onCopy} className="flex-shrink-0">
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {canEdit ? (
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
        ) : (
          <ShieldOff className="h-3.5 w-3.5" />
        )}
        <span>{canEdit ? 'Com permissão de edição' : 'Somente leitura'}</span>
        <span className="mx-1">·</span>
        <span>Expira {expiresLabel}</span>
      </div>

      <Button variant="outline" onClick={onRevoke} className="w-full text-destructive hover:text-destructive">
        <Link2Off className="h-4 w-4" />
        Revogar convite
      </Button>
    </div>
  );
}

function SharedUserSection({
  userName,
  canEdit,
  sharedAt,
  onTogglePermission,
  onRemove,
}: {
  userName: string;
  canEdit: boolean;
  sharedAt: Date;
  onTogglePermission: (v: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{userName}</p>
          <p className="text-xs text-muted-foreground">
            Desde {sharedAt.toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          {canEdit ? (
            <ShieldCheck className="h-4 w-4 text-success" />
          ) : (
            <ShieldOff className="h-4 w-4 text-muted-foreground" />
          )}
          <Label htmlFor="shared-can-edit" className="text-sm cursor-pointer">
            Pode editar o plano
          </Label>
        </div>
        <Switch id="shared-can-edit" checked={canEdit} onCheckedChange={onTogglePermission} />
      </div>

      <Button variant="outline" onClick={onRemove} className="w-full text-destructive hover:text-destructive">
        <UserMinus className="h-4 w-4" />
        Remover acesso
      </Button>
    </div>
  );
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'em breve';
  if (diffHours < 24) return `em ${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  return `em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
}
