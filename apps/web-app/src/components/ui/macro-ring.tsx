import { cn } from '@/lib/utils';

interface MacroRingProps {
  protein: number;
  carbs: number;
  fat: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function MacroRing({
  protein,
  carbs,
  fat,
  size = 120,
  strokeWidth = 12,
  className,
}: MacroRingProps) {
  const total = protein + carbs + fat;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const proteinPct = total > 0 ? protein / total : 0;
  const carbsPct = total > 0 ? carbs / total : 0;
  const fatPct = total > 0 ? fat / total : 0;

  const proteinOffset = 0;
  const carbsOffset = proteinPct * circumference;
  const fatOffset = (proteinPct + carbsPct) * circumference;

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        
        {/* Fat segment */}
        {fat > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--fat))"
            strokeWidth={strokeWidth}
            strokeDasharray={`${fatPct * circumference} ${circumference}`}
            strokeDashoffset={-fatOffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        )}
        
        {/* Carbs segment */}
        {carbs > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--carbs))"
            strokeWidth={strokeWidth}
            strokeDasharray={`${carbsPct * circumference} ${circumference}`}
            strokeDashoffset={-carbsOffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        )}
        
        {/* Protein segment */}
        {protein > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--protein))"
            strokeWidth={strokeWidth}
            strokeDasharray={`${proteinPct * circumference} ${circumference}`}
            strokeDashoffset={-proteinOffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        )}
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-display text-foreground">
          {total.toFixed(0)}g
        </span>
        <span className="text-xs text-muted-foreground">total</span>
      </div>
    </div>
  );
}
