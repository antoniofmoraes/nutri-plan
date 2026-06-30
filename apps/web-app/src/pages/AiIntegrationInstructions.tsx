import { Link } from 'react-router-dom';
import { Bot, CheckCircle2, Clipboard, ExternalLink, LockKeyhole, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const mcpUrl = 'https://nutriplan.antoniomoraes.space/api/mcp';

export default function AiIntegrationInstructions() {
  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(mcpUrl);
    toast.success('Endereco copiado');
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow mb-2">Integracoes IA</div>
          <h1 className="text-[32px] font-bold leading-[1.1]">
            Como conectar sua IA
          </h1>
          <p className="mt-2 max-w-[68ch] text-sm text-muted">
            Antes de conectar, escolha quais planos a IA pode ler ou editar. A autorizacao segura acontece pela sua conta NutriPlan.
          </p>
        </div>
        <Button variant="sec" asChild>
          <Link to="/integracoes-ia">
            <ShieldCheck size={16} />
            Permissoes
          </Link>
        </Button>
      </div>

      <section className="bg-surface border border-line rounded-lg shadow-1 p-[22px]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <div className="eyebrow mb-2">Endereco MCP</div>
            <h2 className="text-[19px] font-semibold">Servidor do NutriPlan</h2>
            <p className="mt-1.5 max-w-[68ch] text-sm text-muted">
              Este e o endereco que clientes compativeis com MCP usarao para conversar com o NutriPlan.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="rounded-md border border-line bg-surface-alt px-3 py-2 font-mono text-[12px] text-ink">
              {mcpUrl}
            </div>
            <Button variant="sec" onClick={handleCopyUrl}>
              <Clipboard size={16} />
              Copiar
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3.5 md:grid-cols-3">
        <StepCard
          number="01"
          title="Liberar planos"
          text="Na pagina de permissoes, marque cada plano como Desativado, Ler ou Editar."
        />
        <StepCard
          number="02"
          title="Conectar a IA"
          text="No ChatGPT, Claude ou outro cliente compativel, adicione o servidor MCP do NutriPlan."
        />
        <StepCard
          number="03"
          title="Autorizar conta"
          text="Entre com sua conta NutriPlan quando o login seguro for solicitado."
        />
      </section>

      <section className="grid gap-3.5 lg:grid-cols-2">
        <InstructionPanel
          icon={Bot}
          title="ChatGPT"
          items={[
            'Abra a area de apps, conectores ou ferramentas do ChatGPT.',
            'Adicione o servidor MCP do NutriPlan usando o endereco acima.',
            'Autorize sua conta NutriPlan quando a tela de login aparecer.',
            'Peca para consultar ou ajustar apenas os planos liberados.',
          ]}
        />
        <InstructionPanel
          icon={ExternalLink}
          title="Claude"
          items={[
            'Abra a area de conectores do Claude.',
            'Adicione um conector remoto usando o endereco MCP do NutriPlan.',
            'Conclua a autorizacao da sua conta NutriPlan.',
            'Use comandos como consultar plano, buscar alimentos ou ajustar refeicoes.',
          ]}
        />
      </section>

      <section className="bg-surface border border-line rounded-lg shadow-1 p-[22px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-md bg-accent-soft text-accent">
            <LockKeyhole size={20} strokeWidth={1.7} />
          </div>
          <div>
            <div className="eyebrow mb-2">Status</div>
            <h2 className="text-[19px] font-semibold">Login seguro pronto no NutriPlan</h2>
            <p className="mt-1.5 max-w-[76ch] text-sm text-muted">
              O NutriPlan ja possui autorizacao OAuth para integracoes MCP. A disponibilidade final ainda depende do ChatGPT, Claude ou outro cliente permitir adicionar conectores personalizados na sua conta.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StepCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-surface border border-line rounded-lg shadow-1 p-[18px]">
      <div className="mono mb-3 text-[11.5px] uppercase tracking-[0.08em] text-muted">
        Passo {number}
      </div>
      <h2 className="text-[18px] font-semibold">{title}</h2>
      <p className="mt-1.5 text-sm text-muted">{text}</p>
    </div>
  );
}

function InstructionPanel({
  icon: Icon,
  title,
  items,
}: {
  icon: LucideIcon;
  title: string;
  items: string[];
}) {
  return (
    <div className="bg-surface border border-line rounded-lg shadow-1 p-[22px]">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-accent-soft text-accent">
          <Icon size={18} strokeWidth={1.7} />
        </div>
        <h2 className="text-[19px] font-semibold">{title}</h2>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-2.5 text-sm text-muted">
            <CheckCircle2 size={16} strokeWidth={1.7} className="mt-0.5 flex-shrink-0 text-ink" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
