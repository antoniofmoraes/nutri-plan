import { Meal, MacroSummary } from '@/types';
import { Badge } from '@/components/ui/badge';

function MacroLine({ macros }: { macros: MacroSummary }) {
  return (
    <div className="mono inline-flex gap-2.5 text-[11.5px] text-muted flex-wrap items-center">
      <span className="text-ink-2">
        {Math.round(macros.calories)}<span className="text-muted"> kcal</span>
      </span>
      <span><span className="text-m-pro">●</span> P {Math.round(macros.protein)}g</span>
      <span><span className="text-m-carb">●</span> C {Math.round(macros.carbs)}g</span>
      <span><span className="text-m-fat">●</span> G {Math.round(macros.fat)}g</span>
    </div>
  );
}

interface DashboardMealCardProps {
  meal: Meal;
  macros: MacroSummary;
}

export function DashboardMealCard({ meal, macros }: DashboardMealCardProps) {
  return (
    <div className="bg-surface border border-line rounded-lg shadow-1 p-4">
      <div className="flex items-center justify-between mb-2.5 gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-semibold text-[14.5px]">{meal.name}</span>
          {meal.time && (
            <span className="mono text-[11px] text-muted">{meal.time}</span>
          )}
          {meal.isCheat && <Badge variant="cheat">Livre</Badge>}
        </div>
        {!meal.isCheat && <MacroLine macros={macros} />}
      </div>
      {meal.isCheat ? (
        <div className="mono text-xs text-muted py-2">
          Refeição livre · macros não contabilizados.
        </div>
      ) : meal.foods.length === 0 ? (
        <div className="mono text-xs text-muted">Nenhum alimento.</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {meal.foods.map(({ food, quantity }, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 text-[12.5px] px-2.5 py-1 rounded-lg bg-surface-alt border border-line"
            >
              {food.name}
              <span className="mono text-[11px] text-muted">{quantity}g</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
