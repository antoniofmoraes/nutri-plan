import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Food, WeekDay } from '@/types';
import { weekDays, type ViewProps } from './types';
import { EditableFoodRow } from './EditableFoodRow';
import { cn } from '@/lib/utils';

interface DayViewProps extends ViewProps {
  day: WeekDay;
  foods: Food[];
  onChangeDay: (day: WeekDay) => void;
  onUpdateFood: (mealId: string, foodId: string, updates: { newFoodId?: string; quantity?: number }) => void;
}

export function DayView({ plan, readOnly, day, foods, onChangeDay, onAddFood, onRemoveFood, onUpdateFood, onToggleCheat, calculateDayMacros, calculateMealMacros }: DayViewProps) {
  const dayPlan = plan.days.find(d => d.day === day);
  const dayMacros = dayPlan ? calculateDayMacros(dayPlan) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const target = {
    cal: plan.dailyCalories || 2000,
    p: plan.dailyProtein || 150,
    c: plan.dailyCarbs || 250,
    f: plan.dailyFat || 70,
  };

  const macroStats = [
    { key: 'cal', label: 'Calorias', value: dayMacros.calories, target: target.cal, unit: 'kcal', color: 'var(--m-cal)' },
    { key: 'p', label: 'Proteína', value: dayMacros.protein, target: target.p, unit: 'g', color: 'var(--m-pro)' },
    { key: 'c', label: 'Carbo.', value: dayMacros.carbs, target: target.c, unit: 'g', color: 'var(--m-carb)' },
    { key: 'f', label: 'Gordura', value: dayMacros.fat, target: target.f, unit: 'g', color: 'var(--m-fat)' },
  ];

  return (
    <div className="space-y-5">
      {/* Day tabs */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((d, i) => {
          const isActive = day === d.value;
          return (
            <button
              key={d.value}
              onClick={() => onChangeDay(d.value)}
              className={cn(
                'border rounded-[var(--r-md)] py-2.5 px-2 text-center transition-[background,border-color,color] duration-120 cursor-pointer',
                isActive
                  ? 'bg-ink text-bg border-ink'
                  : 'bg-surface border-line hover:bg-surface-alt'
              )}
            >
              <span className="text-[13px] font-medium hidden min-[640px]:block">{d.short}</span>
              <span className="text-[13px] font-medium min-[640px]:hidden">{d.letter}</span>
              <span
                className={cn(
                  'block font-mono text-[11px] mt-0.5 hidden min-[640px]:block',
                  isActive ? 'opacity-70' : 'text-muted'
                )}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day totals */}
      <div className="bg-surface border border-line rounded-lg shadow-1 p-4 space-y-4">
        <div className="eyebrow">Totais do dia</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {macroStats.map((s) => {
            const pct = Math.min(100, Math.round((s.value / s.target) * 100));
            const remaining = s.target - s.value;
            const over = remaining < 0;
            return (
              <div
                key={s.key}
                className="rounded-lg border border-line bg-surface-alt/40 px-3 py-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-semibold uppercase tracking-wider" style={{ color: s.color }}>
                    {s.label}
                  </span>
                  <span className="mono text-[10.5px] text-muted">{pct}%</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="num text-[22px] font-bold leading-none" style={{ color: s.color }}>
                    {Math.round(s.value)}
                  </span>
                  <span className="mono text-[13px] text-muted font-medium">
                    / {s.target} {s.unit}
                  </span>
                </div>
                <div className="h-[4px] bg-surface-alt rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{ width: `${pct}%`, background: s.color }}
                  />
                </div>
                <div className={cn(
                  'mono text-[11px] font-medium',
                  over ? 'text-danger' : 'text-muted'
                )}>
                  {over
                    ? `+${Math.abs(Math.round(remaining))} ${s.unit} acima`
                    : `faltam ${Math.round(remaining)} ${s.unit}`
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Meal cards */}
      {dayPlan?.meals.length === 0 ? (
        <div className="bg-surface border border-line rounded-lg shadow-1 p-12 flex flex-col items-center text-center">
          <p className="text-muted">Adicione uma refeição no botão acima para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayPlan?.meals.map((meal) => {
            const macros = calculateMealMacros(meal);
            return (
              <div key={meal.id} className="bg-surface border border-line rounded-lg shadow-1 overflow-hidden">
                {/* Meal header */}
                <div className="px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-semibold text-[14.5px]">{meal.name}</span>
                    {meal.time && <span className="mono text-[11px] text-muted">{meal.time}</span>}
                    {meal.isCheat && <Badge variant="cheat">Livre</Badge>}
                    {!meal.isCheat && (
                      <div className="mono inline-flex gap-2 text-[11.5px] text-muted flex-wrap items-center">
                        <span className="text-ink-2">{Math.round(macros.calories)} kcal</span>
                        <span>P {Math.round(macros.protein)}g</span>
                        <span>C {Math.round(macros.carbs)}g</span>
                        <span>G {Math.round(macros.fat)}g</span>
                      </div>
                    )}
                  </div>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => onToggleCheat(meal.id, meal.isCheat)}
                    >
                      {meal.isCheat ? 'Desmarcar livre' : 'Marcar livre'}
                    </Button>
                  )}
                </div>

                {/* Meal body */}
                {meal.isCheat ? (
                  <div className="px-4 pb-4 mono text-xs text-muted">
                    Esta refeição não conta nos macros do dia.
                  </div>
                ) : (
                  <div className="border-t border-line">
                    {meal.foods.length === 0 ? (
                      <div className="p-4">
                        {readOnly ? (
                          <p className="text-muted text-sm text-center">Nenhum alimento cadastrado</p>
                        ) : (
                          <Button
                            variant="sec"
                            size="sm"
                            className="w-full border-dashed"
                            onClick={() => onAddFood(meal.id)}
                          >
                            <Plus size={14} />
                            Adicionar alimento
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div>
                        {meal.foods.map(({ food, quantity }) => (
                          <EditableFoodRow
                            key={food.id}
                            foods={foods}
                            currentFood={food}
                            currentQuantity={quantity}
                            readOnly={readOnly}
                            onSave={(updates) => onUpdateFood(meal.id, food.id, updates)}
                            onRemove={() => onRemoveFood(meal.id, food.id)}
                          />
                        ))}
                        {!readOnly && (
                          <div className="p-3 pt-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onAddFood(meal.id)}
                            >
                              <Plus size={14} />
                              Adicionar alimento
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
