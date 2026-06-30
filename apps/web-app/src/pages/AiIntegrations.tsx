import { Link } from 'react-router-dom';
import { Bot, Check, Eye, LockKeyhole, Pencil, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useMcpIntegrations } from '@/hooks/useMcpIntegrations';
import type { McpAccessMode, McpMealPlanAccess } from '@/services/mcpService';

const modeCopy: Record<McpAccessMode, { label: string; description: string }> = {
  off: {
    label: 'Desativado',
    description: 'A IA nao ve este plano.',
  },
  read: {
    label: 'Somente leitura',
    description: 'A IA pode consultar refeicoes, metas e alimentos.',
  },
  edit: {
    label: 'Pode editar',
    description: 'A IA pode ajustar metas e refeicoes deste plano.',
  },
};

function getMode(access: McpMealPlanAccess): McpAccessMode {
  if (access.canEdit) return 'edit';
  if (access.canRead) return 'read';
  return 'off';
}

export default function AiIntegrations() {
  const {
    mealPlanAccess,
    isLoading,
    setMealPlanAccess,
    pendingPlanId,
    isUpdating,
  } = useMcpIntegrations();

  const handleModeChange = async (plan: McpMealPlanAccess, mode: McpAccessMode) => {
    if (getMode(plan) === mode) return;

    try {
      await setMealPlanAccess({ planId: plan.planId, mode });
      toast.success('Permissao atualizada');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Erro ao atualizar permissao';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow mb-2">Integracoes</div>
          <h1 className="text-[32px] font-bold leading-[1.1]">
            IA conectada
          </h1>
          <p className="mt-2 max-w-[62ch] text-sm text-muted">
            Escolha quais planos uma IA autorizada pode consultar ou editar. O acesso fica desligado por padrao.
          </p>
        </div>
        <Button variant="sec" asChild>
          <Link to="/planos">
            <Pencil size={16} />
            Gerenciar planos
          </Link>
        </Button>
      </div>

      <section className="grid gap-3.5 md:grid-cols-3">
        <InfoPanel
          icon={LockKeyhole}
          title="Voce controla"
          text="Cada plano tem uma permissao propria. Desligado significa que a IA nao recebe dados daquele plano."
        />
        <InfoPanel
          icon={Eye}
          title="Comece lendo"
          text="Somente leitura permite revisar metas, refeicoes e alimentos sem alterar nada."
        />
        <InfoPanel
          icon={ShieldCheck}
          title="Edite com cuidado"
          text="Permita edicao apenas nos planos que voce aceita que a IA ajuste."
        />
      </section>

      <section className="bg-surface border border-line rounded-lg shadow-1">
        <div className="border-b border-line px-[22px] py-[18px]">
          <div className="flex items-center gap-2">
            <Bot size={18} strokeWidth={1.7} className="text-ink" />
            <h2 className="text-[19px] font-semibold">Permissoes por plano</h2>
          </div>
          <p className="mt-1.5 text-sm text-muted">
            Use estes modos antes de conectar sua conta a ChatGPT, Claude ou outro cliente compativel.
          </p>
        </div>

        {isLoading ? (
          <LoadingState label="Carregando integracoes..." />
        ) : mealPlanAccess.length === 0 ? (
          <div className="p-[22px]">
            <EmptyState
              icon={Bot}
              title="Nenhum plano disponivel"
              description="Crie um plano alimentar para liberar acesso a uma IA depois."
              action={
                <Button variant="acc" asChild>
                  <Link to="/planos">Criar plano</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-line">
            {mealPlanAccess.map((plan) => (
              <PlanAccessRow
                key={plan.planId}
                plan={plan}
                isPending={isUpdating && pendingPlanId === plan.planId}
                onChangeMode={(mode) => handleModeChange(plan, mode)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="bg-surface border border-line rounded-lg shadow-1 p-[22px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="eyebrow mb-2">Conexao</div>
            <h2 className="text-[19px] font-semibold">Proximo passo: login seguro da IA</h2>
            <p className="mt-1.5 max-w-[70ch] text-sm text-muted">
              Esta tela ja prepara as permissoes. Para uso publico no ChatGPT ou Claude, ainda falta publicar a conexao com OAuth para o usuario autorizar a conta sem copiar token manualmente.
            </p>
          </div>
          <div className="rounded-md border border-line bg-surface-alt px-3 py-2 font-mono text-[11.5px] text-muted">
            /api/mcp
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof LockKeyhole;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-surface border border-line rounded-lg shadow-1 p-[18px]">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-md bg-accent-soft text-accent">
        <Icon size={18} strokeWidth={1.7} />
      </div>
      <h2 className="text-[18px] font-semibold">{title}</h2>
      <p className="mt-1.5 text-sm text-muted">{text}</p>
    </div>
  );
}

function PlanAccessRow({
  plan,
  isPending,
  onChangeMode,
}: {
  plan: McpMealPlanAccess;
  isPending: boolean;
  onChangeMode: (mode: McpAccessMode) => void;
}) {
  const mode = getMode(plan);
  const updatedAt = plan.updatedAt
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(plan.updatedAt))
    : null;

  return (
    <div className="grid gap-4 px-[22px] py-[18px] lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-[18px] font-semibold">{plan.planName}</h3>
          <StatusBadge mode={mode} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {modeCopy[mode].description}
        </p>
        {!plan.canGrantEdit && (
          <p className="mt-1 text-[12.5px] text-muted">
            Este plano foi compartilhado sem permissao de edicao.
          </p>
        )}
        {updatedAt && (
          <p className="mono mt-2 text-[11.5px] uppercase tracking-[0.06em] text-muted-2">
            Atualizado em {updatedAt}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <ModeButton
          icon={X}
          label="Desativado"
          active={mode === 'off'}
          disabled={isPending}
          onClick={() => onChangeMode('off')}
        />
        <ModeButton
          icon={Eye}
          label="Ler"
          active={mode === 'read'}
          disabled={isPending}
          onClick={() => onChangeMode('read')}
        />
        <ModeButton
          icon={Pencil}
          label="Editar"
          active={mode === 'edit'}
          disabled={isPending || !plan.canGrantEdit}
          onClick={() => onChangeMode('edit')}
        />
      </div>
    </div>
  );
}

function StatusBadge({ mode }: { mode: McpAccessMode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.08em]',
        mode === 'off' && 'border-line text-muted',
        mode === 'read' && 'border-line bg-surface-alt text-ink-2',
        mode === 'edit' && 'border-line bg-ink text-bg'
      )}
    >
      {mode === 'edit' && <Check size={12} />}
      {modeCopy[mode].label}
    </span>
  );
}

function ModeButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex min-h-11 items-center justify-center gap-2 rounded-[var(--r-md)] border px-3 text-[13px] font-medium',
        'transition-[background,border-color,color] duration-120 disabled:cursor-not-allowed disabled:opacity-50',
        active
          ? 'border-transparent bg-ink text-bg'
          : 'border-line bg-surface text-ink hover:bg-surface-alt'
      )}
    >
      <Icon size={16} strokeWidth={1.7} />
      {label}
    </button>
  );
}
