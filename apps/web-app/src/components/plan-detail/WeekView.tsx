import { Plus, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { WeekDay, Meal, MealPlan } from '@/types';
import { weekDays, type ViewProps } from './types';
import { CopyMealPopover } from './CopyMealPopover';

interface WeekViewProps extends ViewProps {
  onDayClick: (day: WeekDay) => void;
  onCopyMeal: (sourceMealId: string, targetMealIds: string[]) => void;
}

export function WeekView({ plan, onDayClick, onAddFood, onRemoveFood, onToggleCheat, onCopyMeal, calculateDayMacros, calculateMealMacros }: WeekViewProps) {
  const orderedSlots = [...plan.slots].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="border-b">
              <th className="w-[10%] p-2 text-center align-middle border-r bg-muted/30" />
              {weekDays.map((day) => {
                const dayPlan = plan.days.find(d => d.day === day.value);
                const dayMacros = dayPlan ? calculateDayMacros(dayPlan) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
                return (
                  <th key={day.value} className="p-2 text-left align-bottom border-r last:border-r-0">
                    <button
                      type="button"
                      onClick={() => onDayClick(day.value)}
                      className="text-left hover:opacity-80 transition-opacity w-full"
                    >
                      <div className="text-sm font-display font-bold flex items-baseline justify-between gap-1">
                        <span>{day.short}</span>
                        <span className="text-xs font-normal text-accent">
                          {dayMacros.calories.toFixed(0)} kcal
                        </span>
                      </div>
                      <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground font-normal">
                        <span>P: {dayMacros.protein.toFixed(0)}g</span>
                        <span>C: {dayMacros.carbs.toFixed(0)}g</span>
                        <span>G: {dayMacros.fat.toFixed(0)}g</span>
                      </div>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {orderedSlots.map((slot) => (
              <tr key={slot.id} className="border-b last:border-b-0">
                <td className="p-2 align-middle text-center border-r bg-muted/30">
                  <p className="text-xs font-semibold break-words">{slot.name}</p>
                  {slot.time && (
                    <p className="text-[10px] text-muted-foreground">{slot.time}</p>
                  )}
                </td>
                {weekDays.map((day) => {
                  const dayPlan = plan.days.find(d => d.day === day.value);
                  const meal = dayPlan?.meals.find(m => m.slotId === slot.id);
                  if (!meal) return <td key={day.value} className="p-2 align-top border-r last:border-r-0" />;
                  const macros = calculateMealMacros(meal);
                  return (
                    <td
                      key={day.value}
                      className={`p-2 align-top border-r last:border-r-0 ${
                        meal.isCheat ? 'bg-accent/5' : ''
                      }`}
                    >
                      <div className="flex flex-col gap-1 h-full">
                        <span className="text-[10px] text-accent font-medium">
                          {macros.calories.toFixed(0)} kcal
                        </span>

                        {meal.isCheat ? (
                          <>
                            <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full self-start flex items-center gap-1">
                              <Sparkles className="h-2.5 w-2.5" /> Livre
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] justify-start px-1 mt-auto"
                              onClick={() => onToggleCheat(meal.id, true)}
                            >
                              Desmarcar
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="space-y-0.5 flex-1">
                              {meal.foods.length === 0 ? (
                                <p className="text-[10px] text-muted-foreground italic">Vazio</p>
                              ) : (
                                meal.foods.map(({ food, quantity }, idx) => (
                                  <div key={idx} className="text-[11px] flex items-center justify-between gap-1 group">
                                    <span className="truncate">
                                      {food.name}{' '}
                                      <span className="text-muted-foreground">{quantity}g</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onRemoveFood(meal.id, food.id)}
                                      className="opacity-0 group-hover:opacity-100 hover:text-destructive flex-shrink-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                            <div className="flex gap-1 mt-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs flex-1 px-1"
                                onClick={() => onAddFood(meal.id)}
                                title="Adicionar alimento"
                              >
                                <Plus className="h-3 w-3" />
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
                                size="sm"
                                className="h-6 text-xs px-1"
                                onClick={() => onToggleCheat(meal.id, false)}
                                title="Marcar como livre"
                              >
                                <Sparkles className="h-3 w-3" />
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
      </CardContent>
    </Card>
  );
}
