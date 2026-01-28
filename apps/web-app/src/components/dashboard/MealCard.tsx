import { Meal, MacroSummary } from '@/types';
import { Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MealCardProps {
  meal: Meal;
  macros: MacroSummary;
  onClick?: () => void;
}

export function MealCard({ meal, macros, onClick }: MealCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-card p-4 shadow-soft transition-all duration-300 hover:shadow-medium',
        onClick && 'cursor-pointer hover:-translate-y-0.5'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{meal.name}</h4>
            {meal.time && (
              <p className="text-xs text-muted-foreground">{meal.time}</p>
            )}
          </div>
        </div>
        {onClick && (
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <span className="rounded-full bg-accent/10 px-2.5 py-1 font-medium text-accent">
          {macros.calories.toFixed(0)} kcal
        </span>
        <span className="text-muted-foreground">
          P: {macros.protein.toFixed(0)}g
        </span>
        <span className="text-muted-foreground">
          C: {macros.carbs.toFixed(0)}g
        </span>
        <span className="text-muted-foreground">
          G: {macros.fat.toFixed(0)}g
        </span>
      </div>

      {meal.foods.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {meal.foods.slice(0, 3).map(({ food }, idx) => (
            <span
              key={idx}
              className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
            >
              {food.name}
            </span>
          ))}
          {meal.foods.length > 3 && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              +{meal.foods.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
