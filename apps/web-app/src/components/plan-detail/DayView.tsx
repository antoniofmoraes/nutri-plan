import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Food, WeekDay } from '@/types';
import { weekDays, type ViewProps } from './types';
import { EditableFoodRow } from './EditableFoodRow';

interface DayViewProps extends ViewProps {
  day: WeekDay;
  foods: Food[];
  onChangeDay: (day: WeekDay) => void;
  onUpdateFood: (mealId: string, foodId: string, updates: { newFoodId?: string; quantity?: number }) => void;
}

export function DayView({ plan, day, foods, onChangeDay, onAddFood, onRemoveFood, onUpdateFood, onToggleCheat, calculateDayMacros, calculateMealMacros }: DayViewProps) {
  const dayPlan = plan.days.find(d => d.day === day);
  const dayMacros = dayPlan ? calculateDayMacros(dayPlan) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  return (
    <div className="space-y-4">
      <Tabs value={day} onValueChange={(v) => onChangeDay(v as WeekDay)}>
        <TabsList className="grid w-full grid-cols-7 h-auto">
          {weekDays.map((d) => (
            <TabsTrigger
              key={d.value}
              value={d.value}
              className="text-xs min-h-[44px] px-1 sm:px-3"
            >
              <span className="hidden sm:inline">{d.short}</span>
              <span className="sm:hidden">{d.short.slice(0, 1)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-4 gap-2 sm:gap-3 rounded-xl bg-card p-3 sm:p-4 shadow-soft">
        <div className="text-center">
          <p className="text-lg sm:text-2xl font-bold text-accent font-display">{dayMacros.calories.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">kcal</p>
        </div>
        <div className="text-center">
          <p className="text-lg sm:text-2xl font-bold text-protein font-display">{dayMacros.protein.toFixed(0)}g</p>
          <p className="text-xs text-muted-foreground"><span className="sm:hidden">P</span><span className="hidden sm:inline">Proteína</span></p>
        </div>
        <div className="text-center">
          <p className="text-lg sm:text-2xl font-bold text-carbs font-display">{dayMacros.carbs.toFixed(0)}g</p>
          <p className="text-xs text-muted-foreground"><span className="sm:hidden">C</span><span className="hidden sm:inline">Carbos</span></p>
        </div>
        <div className="text-center">
          <p className="text-lg sm:text-2xl font-bold text-fat font-display">{dayMacros.fat.toFixed(0)}g</p>
          <p className="text-xs text-muted-foreground"><span className="sm:hidden">G</span><span className="hidden sm:inline">Gordura</span></p>
        </div>
      </div>

      {dayPlan?.meals.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-muted p-8 text-center">
          <p className="text-muted-foreground">Adicione uma refeição no botão acima para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dayPlan?.meals.map((meal) => {
            const macros = calculateMealMacros(meal);
            return (
              <Card key={meal.id} className={meal.isCheat ? 'border-accent/40 bg-accent/5' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base font-display">{meal.name}</CardTitle>
                      {meal.time && (
                        <span className="text-xs text-muted-foreground">• {meal.time}</span>
                      )}
                      {meal.isCheat && (
                        <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Livre
                        </span>
                      )}
                    </div>
                    <Button
                      variant={meal.isCheat ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onToggleCheat(meal.id, meal.isCheat)}
                    >
                      {meal.isCheat ? 'Cancelar livre' : 'Marcar livre'}
                    </Button>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="text-accent font-medium">{macros.calories.toFixed(0)} kcal</span>
                    <span>P: {macros.protein.toFixed(0)}g</span>
                    <span>C: {macros.carbs.toFixed(0)}g</span>
                    <span>G: {macros.fat.toFixed(0)}g</span>
                    {meal.isCheat && <span className="italic">(estimado pela média)</span>}
                  </div>
                </CardHeader>
                {!meal.isCheat && (
                  <CardContent>
                    {meal.foods.length === 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed"
                        onClick={() => onAddFood(meal.id)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Adicionar alimento
                      </Button>
                    ) : (
                      <div className="space-y-2">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => onAddFood(meal.id)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Mais
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
