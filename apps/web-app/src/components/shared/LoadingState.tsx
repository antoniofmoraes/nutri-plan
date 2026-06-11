import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = 'Carregando…', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
      <Loader2 className="h-5 w-5 animate-spin text-muted" />
      <p className="mono text-[11.5px] text-muted uppercase tracking-[0.08em]">{label}</p>
    </div>
  );
}

export function FullScreenLoading({ label }: { label?: string }) {
  return (
    <div className="min-h-screen bg-bg grid place-items-center">
      <LoadingState label={label} />
    </div>
  );
}
