import { cn } from '@/lib/utils';

interface MacroCardProps {
  label: string;
  value: number;
  unit: string;
  color: 'calories' | 'protein' | 'carbs' | 'fat';
  icon: React.ReactNode;
}

const colorMap = {
  calories: 'from-accent to-orange-400',
  protein: 'from-protein to-pink-400',
  carbs: 'from-carbs to-amber-400',
  fat: 'from-fat to-sky-400',
};

const bgColorMap = {
  calories: 'bg-accent/10',
  protein: 'bg-protein/10',
  carbs: 'bg-carbs/10',
  fat: 'bg-fat/10',
};

export function MacroCard({ label, value, unit, color, icon }: MacroCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card p-5 shadow-medium transition-all duration-300 hover:shadow-strong hover:-translate-y-1">
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-5', colorMap[color])} />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground font-display">
            {value.toFixed(0)}
            <span className="ml-1 text-lg font-normal text-muted-foreground">{unit}</span>
          </p>
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', bgColorMap[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
