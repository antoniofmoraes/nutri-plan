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

export function DayView({ plan, day, foods, onChangeDay, onAddFood, onRemoveFood, onUpdateFood, onToggleCheat, calculateDayMacros, calculateMealMacros }: DayViewProps) {
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
                'border rounded-[var(--r-md)] py-2.5 px-2 text-center transition-[background,border-color,color] duration-[120ms] cursor-pointer',
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
      <div className="bg-surface border border-line rounded-lg shadow-1 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="eyebrow mb-1">Totais do dia</div>
            <div className="mono text-[11.5px] text-muted">
              meta {target.cal.toLocaleString("pt-BR")} kcal
            </div>
          </div>
          <div className="flex gap-4">
            {macroStats.map((s) => {
              const pct = Math.min(100, Math.round((s.value / s.target) * 100));
              return (
                <div key={s.key} className="text-center min-w-[60px]">
                  <div className="eyebrow mb-1">{s.label}</div>
                  <div className="num text-[18px] font-semibold leading-none mb-1.5">
                    {Math.round(s.value)}
                  </div>
                  <div className="h-[3px] w-[60px] bg-surface-alt rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{ width: `${pct}%`, background: s.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
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
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => onToggleCheat(meal.id, meal.isCheat)}
                  >
                    {meal.isCheat ? 'Desmarcar livre' : 'Marcar livre'}
                  </Button>
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
                        <Button
                          variant="sec"
                          size="sm"
                          className="w-full border-dashed"
                          onClick={() => onAddFood(meal.id)}
                        >
                          <Plus size={14} />
                          Adicionar alimento
                        </Button>
                      </div>
                    ) : (
                      <div>
                        {meal.foods.map(({ food, quantity }) => (
                          <EditableFoodRow
                            key={food.id}
                            foods={foods}
                            currentFood={food}
                            currentQuantity={quantity}
                            onSave={(updates) => onUpdateFood(meal.id, food.id, updates)}
                            onRemove={() => onRemoveFood(meal.id, food.id)}
                          />
                        ))}
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
