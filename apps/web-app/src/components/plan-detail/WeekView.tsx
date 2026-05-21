import { Plus, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WeekDay, Meal } from '@/types';
import { weekDays, type ViewProps } from './types';
import { CopyMealPopover } from './CopyMealPopover';

interface WeekViewProps extends ViewProps {
  onDayClick: (day: WeekDay) => void;
  onCopyMeal: (sourceMealId: string, targetMealIds: string[]) => void;
}

export function WeekView({ plan, onDayClick, onAddFood, onRemoveFood, onToggleCheat, onCopyMeal, calculateDayMacros, calculateMealMacros }: WeekViewProps) {
  const orderedSlots = [...plan.slots].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="bg-surface border border-line rounded-lg shadow-1 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed min-w-[700px]">
          <thead>
            <tr className="border-b border-line">
              <th className="w-[10%] p-2.5 text-center align-middle border-r border-line bg-surface-alt" />
              {weekDays.map((day) => {
                const dayPlan = plan.days.find(d => d.day === day.value);
                const dayMacros = dayPlan ? calculateDayMacros(dayPlan) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
                return (
                  <th key={day.value} className="p-2.5 text-left align-bottom border-r border-line last:border-r-0 bg-surface-alt">
                    <button
                      type="button"
                      onClick={() => onDayClick(day.value)}
                      className="text-left hover:opacity-80 transition-opacity duration-[120ms] w-full"
                    >
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-[13px] font-semibold">{day.short}</span>
                        <span className="num text-[11px] font-semibold" style={{ color: 'var(--m-cal)' }}>
                          {dayMacros.calories.toFixed(0)}
                        </span>
                      </div>
                      <div className="mono flex gap-2 mt-0.5 text-[10px] text-muted">
                        <span>P {dayMacros.protein.toFixed(0)}</span>
                        <span>C {dayMacros.carbs.toFixed(0)}</span>
                        <span>G {dayMacros.fat.toFixed(0)}</span>
                      </div>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {orderedSlots.map((slot) => (
              <tr key={slot.id} className="border-b border-line last:border-b-0">
                <td className="p-2.5 align-middle text-center border-r border-line bg-surface-alt">
                  <p className="text-[11.5px] font-semibold break-words">{slot.name}</p>
                  {slot.time && (
                    <p className="mono text-[10px] text-muted mt-0.5">{slot.time}</p>
                  )}
                </td>
                {weekDays.map((day) => {
                  const dayPlan = plan.days.find(d => d.day === day.value);
                  const meal = dayPlan?.meals.find(m => m.slotId === slot.id);
                  if (!meal) return <td key={day.value} className="p-2 align-top border-r border-line last:border-r-0" />;
                  const macros = calculateMealMacros(meal);
                  return (
                    <td
                      key={day.value}
                      className={`p-2 align-top border-r border-line last:border-r-0 ${
                        meal.isCheat ? 'bg-accent/5' : ''
                      }`}
                    >
                      <div className="flex flex-col gap-1 h-full">
                        <span className="num text-[10.5px] font-medium" style={{ color: 'var(--m-cal)' }}>
                          {macros.calories.toFixed(0)} kcal
                        </span>

                        {meal.isCheat ? (
                          <>
                            <Badge variant="cheat" className="self-start text-[9px] px-1.5 py-0.5">
                              Livre
                            </Badge>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="justify-start px-1 mt-auto text-[10px]"
                              onClick={() => onToggleCheat(meal.id, true)}
                            >
                              Desmarcar
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="space-y-0.5 flex-1">
                              {meal.foods.length === 0 ? (
                                <p className="text-[10.5px] text-muted italic">Vazio</p>
                              ) : (
                                meal.foods.map(({ food, quantity }, idx) => (
                                  <div key={idx} className="text-[11px] flex items-center justify-between gap-1 group">
                                    <span className="truncate">
                                      {food.name}{' '}
                                      <span className="mono text-muted">{quantity}g</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onRemoveFood(meal.id, food.id)}
                                      className="opacity-0 group-hover:opacity-100 hover:text-danger flex-shrink-0 transition-opacity duration-[120ms]"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                            <div className="flex gap-1 mt-auto">
                              <Button
                                variant="sec"
                                size="xs"
                                className="flex-1 px-1"
                                onClick={() => onAddFood(meal.id)}
                                title="Adicionar alimento"
                              >
                                <Plus size={12} />
                              </Button>
                              {meal.foods.length > 0 && (
                                <CopyMealPopover
                                  plan={plan}
                                  meal={meal}
                                  currentDay={day.value}
                                  onCopy={(targetIds) => onCopyMeal(meal.id, targetIds)}
                                />
                              )}
                              <Button
                                variant="ghost"
                                size="xs"
                                className="px-1"
                                onClick={() => onToggleCheat(meal.id, false)}
                                title="Marcar como livre"
                              >
                                <Sparkles size={12} />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
