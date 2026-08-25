import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';

interface UndoResult {
  message: string;
  invalidatedDomains: string[];
}

/// Duração mínima de leitura + toque para um toast acionável (R7 da CHG-002).
const UNDO_TOAST_DURATION = 8000;

export async function undoMutation(token: string): Promise<UndoResult> {
  return api.post<UndoResult>(`/api/undo/${token}`);
}

/// Toast de sucesso com ação `Desfazer`. Sem token, vira um toast informativo comum —
/// é o caso de mutações fora da cobertura de undo (ex.: excluir alimento do catálogo).
export function toastUndo(
  message: string,
  undoToken: string | undefined,
  onUndone: (domains: string[]) => void
) {
  if (!undoToken) {
    toast.success(message);
    return;
  }

  toast.success(message, {
    duration: UNDO_TOAST_DURATION,
    action: {
      label: 'Desfazer',
      onClick: async () => {
        try {
          const result = await undoMutation(undoToken);
          onUndone(result.invalidatedDomains);
          toast.success(result.message);
        } catch (err) {
          // Não simula sucesso: o chamador ressincroniza e a mensagem explica o motivo.
          onUndone([]);
          toast.error(
            err instanceof ApiError ? err.message : 'Não foi possível desfazer'
          );
        }
      },
    },
  });
}
