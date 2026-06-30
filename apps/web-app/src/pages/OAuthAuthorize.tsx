import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, CheckCircle2, ExternalLink, LockKeyhole, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/shared/LoadingState';
import { ApiError } from '@/lib/api';
import { oauthService, type OAuthAuthorizePreview } from '@/services/oauthService';

const scopeLabels: Record<string, string> = {
  'mcp:read': 'Consultar planos liberados',
  'mcp:write': 'Editar planos liberados para edicao',
};

export default function OAuthAuthorize() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [preview, setPreview] = useState<OAuthAuthorizePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    let active = true;

    oauthService.previewAuthorize(params)
      .then((data) => {
        if (!active) return;
        setPreview(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'Solicitacao OAuth invalida');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params]);

  const handleApprove = async () => {
    if (!preview) return;

    setIsApproving(true);
    try {
      const result = await oauthService.confirmAuthorize({
        responseType: params.get('response_type') ?? '',
        clientId: params.get('client_id') ?? '',
        redirectUri: params.get('redirect_uri') ?? '',
        scope: params.get('scope') ?? 'mcp:read',
        state: params.get('state'),
        codeChallenge: params.get('code_challenge') ?? '',
        codeChallengeMethod: params.get('code_challenge_method') ?? '',
      });
      window.location.assign(result.redirectUrl);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao autorizar integracao';
      toast.error(message);
      setIsApproving(false);
    }
  };

  const handleDeny = () => {
    if (!preview) return;

    const redirect = new URL(preview.redirectUri);
    redirect.searchParams.set('error', 'access_denied');
    if (preview.state) redirect.searchParams.set('state', preview.state);
    window.location.assign(redirect.toString());
  };

  if (isLoading) {
    return <LoadingState label="Carregando autorizacao..." />;
  }

  if (error || !preview) {
    return (
      <div className="mx-auto max-w-[640px] space-y-4">
        <div className="bg-surface border border-line rounded-lg shadow-1 p-[22px]">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-surface-alt text-danger">
            <X size={20} strokeWidth={1.7} />
          </div>
          <div className="eyebrow mb-2">OAuth</div>
          <h1 className="text-[24px] font-semibold">Nao foi possivel autorizar</h1>
          <p className="mt-2 text-sm text-muted">{error ?? 'Solicitacao invalida.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-5">
      <div className="bg-surface border border-line rounded-lg shadow-1 p-[22px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-md bg-accent-soft text-accent">
            <Bot size={22} strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <div className="eyebrow mb-2">Autorizacao</div>
            <h1 className="text-[26px] font-bold leading-[1.1]">
              Permitir acesso ao NutriPlan?
            </h1>
            <p className="mt-2 text-sm text-muted">
              {preview.clientName} quer se conectar aos planos que voce liberou para integracoes IA.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-line bg-surface-alt p-4">
          <div className="mb-3 flex items-center gap-2">
            <LockKeyhole size={17} strokeWidth={1.7} className="text-ink" />
            <h2 className="text-[18px] font-semibold">Permissoes solicitadas</h2>
          </div>
          <div className="space-y-2.5">
            {preview.scopes.map((scope) => (
              <div key={scope} className="flex items-center gap-2 text-sm text-muted">
                <CheckCircle2 size={16} strokeWidth={1.7} className="text-ink" />
                <span>{scopeLabels[scope] ?? scope}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-line p-4">
          <div className="mb-1.5 flex items-center gap-2 text-sm font-medium">
            <ExternalLink size={16} strokeWidth={1.7} />
            Retorno autorizado
          </div>
          <p className="break-all font-mono text-[11.5px] text-muted">{preview.redirectUri}</p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={handleDeny} disabled={isApproving}>
            Negar
          </Button>
          <Button variant="acc" onClick={handleApprove} disabled={isApproving}>
            <CheckCircle2 size={16} />
            Autorizar
          </Button>
        </div>
      </div>
    </div>
  );
}
