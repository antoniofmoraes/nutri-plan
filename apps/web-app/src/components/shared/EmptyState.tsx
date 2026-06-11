import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-surface border border-line rounded-lg shadow-1 p-12 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-lg bg-accent-soft text-accent grid place-items-center mb-4">
        <Icon size={26} strokeWidth={1.6} />
      </div>
      <h3 className="text-[19px] font-semibold mb-1.5">{title}</h3>
      <p className="text-muted max-w-[360px] mb-5">{description}</p>
      {action}
    </div>
  );
}
