import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toastUndo } from './undo';

const success = vi.fn();
const error = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (msg: string, opts?: unknown) => success(msg, opts),
    error: (msg: string) => error(msg),
  },
}));

const post = vi.fn();
vi.mock('@/lib/api', async () => {
  class ApiError extends Error {
    constructor(message: string, public statusCode: number) {
      super(message);
    }
  }
  return { api: { post: (url: string) => post(url) }, ApiError };
});

type ToastOptions = { duration: number; action: { label: string; onClick: () => Promise<void> } };
const lastOptions = () => success.mock.calls.at(-1)?.[1] as ToastOptions | undefined;

describe('toastUndo', () => {
  beforeEach(() => {
    success.mockClear();
    error.mockClear();
    post.mockReset();
  });

  it('sem token, emite toast informativo sem ação', () => {
    toastUndo('Alimento excluído', undefined, vi.fn());

    expect(success).toHaveBeenCalledWith('Alimento excluído', undefined);
    expect(lastOptions()).toBeUndefined();
  });

  it('com token, oferece Desfazer com duração mínima de leitura', () => {
    toastUndo('Plano excluído', 'tok-1', vi.fn());

    const opts = lastOptions()!;
    expect(opts.action.label).toBe('Desfazer');
    expect(opts.duration).toBeGreaterThanOrEqual(8000);
  });

  it('desfaz chamando o token da própria mutação', async () => {
    post.mockResolvedValue({ message: 'Alteração desfeita', invalidatedDomains: ['foods'] });
    const onUndone = vi.fn();

    toastUndo('A', 'tok-A', onUndone);
    toastUndo('B', 'tok-B', onUndone);

    // o segundo toast desfaz B, não A
    await lastOptions()!.action.onClick();

    expect(post).toHaveBeenCalledWith('/api/undo/tok-B');
    expect(onUndone).toHaveBeenCalledWith(['foods']);
    expect(success).toHaveBeenLastCalledWith('Alteração desfeita', undefined);
  });

  it('em conflito, não simula sucesso e ressincroniza', async () => {
    const { ApiError } = await import('@/lib/api');
    post.mockRejectedValue(new ApiError('Uma alteração mais recente impede desfazer', 409));
    const onUndone = vi.fn();

    toastUndo('Quantidade alterada', 'tok-C', onUndone);
    await lastOptions()!.action.onClick();

    expect(error).toHaveBeenCalledWith('Uma alteração mais recente impede desfazer');
    expect(onUndone).toHaveBeenCalledWith([]);
  });
});
