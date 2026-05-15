import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, X, Search, Sparkles, CalendarDays, Copy, ChevronUp, ChevronDown, Trash2, Settings2, BookCopy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useMealPlan } from '@/contexts/MealPlanContext';
import { WeekDay, MealSlot, Meal, MealPlan } from '@/types';

const weekDays: { value: WeekDay; label: string; short: string }[] = [
  { value: 'segunda', label: 'Segunda', short: 'Seg' },
  { value: 'terca', label: 'Terça', short: 'Ter' },
  { value: 'quarta', label: 'Quarta', short: 'Qua' },
  { value: 'quinta', label: 'Quinta', short: 'Qui' },
  { value: 'sexta', label: 'Sexta', short: 'Sex' },
  { value: 'sabado', label: 'Sábado', short: 'Sáb' },
  { value: 'domingo', label: 'Domingo', short: 'Dom' },
];

type ViewMode = 'week' | 'day';

export default function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    mealPlans,
    foods,
    presetMeals,
    addSlot,
    updateSlot,
    deleteSlot,
    reorderSlots,
    addFoodToMeal,
    removeFoodFromMeal,
    updateMealFood,
    setMealCheat,
    copyMeal,
    applyPreset,
    calculateMealMacros,
    calculateDayMacros,
  } = useMealPlan();

  const plan = mealPlans.find((p) => p.id === id);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDay, setSelectedDay] = useState<WeekDay>('segunda');

  // Slot manager modal
  const [slotsManagerOpen, setSlotsManagerOpen] = useState(false);

  // Food dialog state
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [foodDialogMode, setFoodDialogMode] = useState<'food' | 'preset'>('food');
  const [targetMealId, setTargetMealId] = useState<string | null>(null);
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [foodQuantity, setFoodQuantity] = useState('100');
  const [foodSearch, setFoodSearch] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  const filteredFoods = useMemo(() => {
    const q = foodSearch.trim().toLowerCase();
    const list = q ? foods.filter(f => f.name.toLowerCase().includes(q)) : foods;
    return list.slice(0, 100);
  }, [foods, foodSearch]);

  const selectedFood = foods.find(f => f.id === selectedFoodId);

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Plano não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/planos')} className="mt-4">
          Voltar para Planos
        </Button>
      </div>
    );
  }

  const handleAddSlot = async (input: { name: string; time?: string }) => {
    await addSlot(plan.id, input);
  };

  const handleUpdateSlot = async (slotId: string, updates: { name?: string; time?: string }) => {
    await updateSlot(plan.id, slotId, updates);
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Apagar essa refeição de todos os dias?')) return;
    await deleteSlot(plan.id, slotId);
  };

  const handleMoveSlot = async (slotId: string, direction: -1 | 1) => {
    const orderedSlots = [...plan.slots].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = orderedSlots.findIndex(s => s.id === slotId);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= orderedSlots.length) return;
    [orderedSlots[idx], orderedSlots[target]] = [orderedSlots[target], orderedSlots[idx]];
    await reorderSlots(plan.id, orderedSlots.map(s => s.id));
  };

  const handleOpenFoodDialog = (mealId: string) => {
    setTargetMealId(mealId);
    setFoodDialogMode('food');
    setSelectedFoodId('');
    setFoodQuantity('100');
    setFoodSearch('');
    setSelectedPresetId('');
    setFoodDialogOpen(true);
  };

  const handleAddFood = async () => {
    if (!targetMealId || !selectedFoodId) return;
    const food = foods.find((f) => f.id === selectedFoodId);
    if (!food) return;
    await addFoodToMeal(plan.id, targetMealId, food, Number(foodQuantity));
    setFoodDialogOpen(false);
  };

  const handleApplyPreset = async () => {
    if (!targetMealId || !selectedPresetId) return;
    await applyPreset(plan.id, selectedPresetId, [targetMealId]);
    setFoodDialogOpen(false);
  };

  const handleRemoveFood = async (mealId: string, foodId: string) => {
    await removeFoodFromMeal(plan.id, mealId, foodId);
  };

  const handleUpdateFood = async (mealId: string, foodId: string, updates: { newFoodId?: string; quantity?: number }) => {
    await updateMealFood(plan.id, mealId, foodId, updates);
  };

  const handleToggleCheat = async (mealId: string, currentlyCheat: boolean) => {
    try {
      await setMealCheat(plan.id, mealId, !currentlyCheat);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar');
    }
  };

  const handleCopyMeal = async (sourceMealId: string, targetMealIds: string[]) => {
    if (targetMealIds.length === 0) return;
    try {
      await copyMeal(plan.id, sourceMealId, targetMealIds);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao copiar');
    }
  };

  const goToDayView = (day: WeekDay) => {
    setSelectedDay(day);
    setViewMode('day');
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate('/planos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground font-display truncate">{plan.name}</h1>
          <p className="text-sm text-muted-foreground">
            {viewMode === 'week' ? 'Visão semanal' : `Visão diária — ${weekDays.find(d => d.value === selectedDay)?.label}`}
          </p>
        </div>
        {viewMode === 'day' && (
          <Button variant="outline" onClick={() => setViewMode('week')}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Semana
          </Button>
        )}
        <Button onClick={() => setSlotsManagerOpen(true)} className="bg-gradient-primary">
          <Settings2 className="mr-1 h-4 w-4" />
          Editar refeições
        </Button>
      </div>

      {plan.slots.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-muted p-10 text-center">
          <p className="text-muted-foreground">
            Adicione uma refeição para começar (Café da manhã, Almoço, …)
          </p>
        </div>
      ) : viewMode === 'week' ? (
        <WeekView
          plan={plan}
          onDayClick={goToDayView}
          onAddFood={handleOpenFoodDialog}
          onRemoveFood={handleRemoveFood}
          onToggleCheat={handleToggleCheat}
          onCopyMeal={handleCopyMeal}
          calculateDayMacros={(day) => calculateDayMacros(day, plan)}
          calculateMealMacros={(meal) => calculateMealMacros(meal, plan)}
        />
      ) : (
        <DayView
          plan={plan}
          day={selectedDay}
          foods={foods}
          onChangeDay={setSelectedDay}
          onAddFood={handleOpenFoodDialog}
          onRemoveFood={handleRemoveFood}
          onUpdateFood={handleUpdateFood}
          onToggleCheat={handleToggleCheat}
          calculateDayMacros={(d) => calculateDayMacros(d, plan)}
          calculateMealMacros={(m) => calculateMealMacros(m, plan)}
        />
      )}

      {/* Slots Manager Dialog */}
      <SlotsManagerDialog
        open={slotsManagerOpen}
        onOpenChange={setSlotsManagerOpen}
        slots={[...plan.slots].sort((a, b) => a.sortOrder - b.sortOrder)}
        onAdd={handleAddSlot}
        onUpdate={handleUpdateSlot}
        onDelete={handleDeleteSlot}
        onMove={handleMoveSlot}
      />

      {/* Food / Preset Dialog */}
      <Dialog open={foodDialogOpen} onOpenChange={setFoodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {foodDialogMode === 'food' ? 'Adicionar Alimento' : 'Aplicar Refeição Pronta'}
            </DialogTitle>
          </DialogHeader>

          {/* Mode toggle */}
          <Tabs value={foodDialogMode} onValueChange={(v) => setFoodDialogMode(v as 'food' | 'preset')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="food" className="text-xs">Alimento</TabsTrigger>
              <TabsTrigger value="preset" className="text-xs" disabled={presetMeals.length === 0}>
                <BookCopy className="mr-1 h-3 w-3" />
                Refeição Pronta
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {foodDialogMode === 'food' ? (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Alimento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {selectedFood ? (
                          <span className="truncate">{selectedFood.name}</span>
                        ) : (
                          <span className="text-muted-foreground">Selecione um alimento</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Buscar alimento..."
                            value={foodSearch}
                            onChange={(e) => setFoodSearch(e.target.value)}
                            className="pl-8 h-8"
                          />
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {filteredFoods.length === 0 ? (
                          <p className="p-3 text-sm text-center text-muted-foreground">
                            Nenhum alimento encontrado
                          </p>
                        ) : (
                          filteredFoods.map((food) => (
                            <button
                              key={food.id}
                              type="button"
                              onClick={() => setSelectedFoodId(food.id)}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary ${
                                selectedFoodId === food.id ? 'bg-secondary' : ''
                              }`}
                            >
                              <div className="font-medium truncate">{food.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {food.calories} kcal/100g
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Quantidade (gramas)</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={foodQuantity}
                    onChange={(e) => setFoodQuantity(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleAddFood} className="bg-gradient-primary" disabled={!selectedFoodId}>
                  Adicionar
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Refeição Pronta</Label>
                  <div className="max-h-64 overflow-y-auto rounded-md border">
                    {presetMeals.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedPresetId(preset.id)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary border-b last:border-b-0 ${
                          selectedPresetId === preset.id ? 'bg-secondary' : ''
                        }`}
                      >
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {preset.foods.length} alimento{preset.foods.length !== 1 ? 's' : ''}
                          {preset.foods.length > 0 && (
                            <span className="ml-1">
                              — {preset.foods.map(f => f.food.name).join(', ')}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Os alimentos atuais da refeição serão substituídos pelos alimentos da refeição pronta.
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleApplyPreset} className="bg-gradient-primary" disabled={!selectedPresetId}>
                  Aplicar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Weekly View ─────────────────────────────────────────────

interface ViewProps {
  plan: MealPlan;
  onAddFood: (mealId: string) => void;
  onRemoveFood: (mealId: string, foodId: string) => void;
  onToggleCheat: (mealId: string, currentlyCheat: boolean) => void;
  calculateDayMacros: (day: MealPlan['days'][number]) => { calories: number; protein: number; carbs: number; fat: number };
  calculateMealMacros: (meal: Meal) => { calories: number; protein: number; carbs: number; fat: number };
}

interface WeekViewProps extends ViewProps {
  onDayClick: (day: WeekDay) => void;
  onCopyMeal: (sourceMealId: string, targetMealIds: string[]) => void;
}

function WeekView({ plan, onDayClick, onAddFood, onRemoveFood, onToggleCheat, onCopyMeal, calculateDayMacros, calculateMealMacros }: WeekViewProps) {
  const orderedSlots = [...plan.slots].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full border-collapse table-fixed">
          {/* Header row: empty corner + day columns */}
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
                {/* Row label: slot name + time */}
                <td className="p-2 align-middle text-center border-r bg-muted/30">
                  <p className="text-xs font-semibold break-words">{slot.name}</p>
                  {slot.time && (
                    <p className="text-[10px] text-muted-foreground">{slot.time}</p>
                  )}
                </td>
                {/* Day cells */}
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

// ─── Day View ────────────────────────────────────────────────

interface DayViewProps extends ViewProps {
  day: WeekDay;
  foods: import('@/types').Food[];
  onChangeDay: (day: WeekDay) => void;
  onUpdateFood: (mealId: string, foodId: string, updates: { newFoodId?: string; quantity?: number }) => void;
}

function DayView({ plan, day, foods, onChangeDay, onAddFood, onRemoveFood, onUpdateFood, onToggleCheat, calculateDayMacros, calculateMealMacros }: DayViewProps) {
  const dayPlan = plan.days.find(d => d.day === day);
  const dayMacros = dayPlan ? calculateDayMacros(dayPlan) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  return (
    <div className="space-y-4">
      {/* Day selector */}
      <Tabs value={day} onValueChange={(v) => onChangeDay(v as WeekDay)}>
        <TabsList className="grid w-full grid-cols-7">
          {weekDays.map((d) => (
            <TabsTrigger key={d.value} value={d.value} className="text-xs">
              {d.short}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Day summary */}
      <div className="grid grid-cols-4 gap-3 rounded-xl bg-card p-4 shadow-soft">
        <div className="text-center">
          <p className="text-2xl font-bold text-accent font-display">{dayMacros.calories.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">kcal</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-protein font-display">{dayMacros.protein.toFixed(0)}g</p>
          <p className="text-xs text-muted-foreground">Proteína</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-carbs font-display">{dayMacros.carbs.toFixed(0)}g</p>
          <p className="text-xs text-muted-foreground">Carbos</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-fat font-display">{dayMacros.fat.toFixed(0)}g</p>
          <p className="text-xs text-muted-foreground">Gordura</p>
        </div>
      </div>

      {/* Meals */}
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

// ─── Copy Meal Popover ──────────────────────────────────────

interface CopyMealPopoverProps {
  plan: MealPlan;
  meal: Meal;
  currentDay: WeekDay;
  onCopy: (targetMealIds: string[]) => void;
}

function CopyMealPopover({ plan, meal, currentDay, onCopy }: CopyMealPopoverProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Find target meals = same slot, other days
  const targets = weekDays
    .filter(d => d.value !== currentDay)
    .map(d => {
      const dp = plan.days.find(p => p.day === d.value);
      const m = dp?.meals.find(x => x.slotId === meal.slotId);
      return m ? { day: d, meal: m } : null;
    })
    .filter((x): x is { day: typeof weekDays[number]; meal: Meal } => x !== null);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === targets.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(targets.map(t => t.meal.id)));
    }
  };

  const handleApply = () => {
    onCopy(Array.from(selected));
    setSelected(new Set());
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 text-xs px-1" title="Copiar para outros dias">
          <Copy className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <p className="text-xs font-semibold px-2 py-1.5">Copiar para:</p>
        <button
          type="button"
          onClick={toggleAll}
          className="w-full text-left px-2 py-1.5 text-xs hover:bg-secondary rounded"
        >
          {selected.size === targets.length ? 'Desmarcar todos' : 'Marcar todos'}
        </button>
        <div className="border-t my-1" />
        <div className="space-y-0.5 max-h-60 overflow-y-auto">
          {targets.map(({ day, meal: target }) => (
            <label
              key={target.id}
              className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded cursor-pointer"
            >
              <Checkbox
                checked={selected.has(target.id)}
                onCheckedChange={() => toggle(target.id)}
              />
              <span className="flex-1">{day.label}</span>
              {target.foods.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  (sobrescreve)
                </span>
              )}
            </label>
          ))}
        </div>
        <div className="border-t mt-1 pt-2">
          <Button
            size="sm"
            className="w-full h-7 text-xs bg-gradient-primary"
            onClick={handleApply}
            disabled={selected.size === 0}
          >
            Copiar ({selected.size})
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Editable Food Row ──────────────────────────────────────

interface EditableFoodRowProps {
  foods: import('@/types').Food[];
  currentFood: import('@/types').Food;
  currentQuantity: number;
  onSave: (updates: { newFoodId?: string; quantity?: number }) => void;
  onRemove: () => void;
}

function EditableFoodRow({ foods, currentFood, currentQuantity, onSave, onRemove }: EditableFoodRowProps) {
  const [editing, setEditing] = useState(false);
  const [foodId, setFoodId] = useState(currentFood.id);
  const [quantity, setQuantity] = useState(currentQuantity.toString());
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? foods.filter(f => f.name.toLowerCase().includes(q)) : foods;
    return list.slice(0, 100);
  }, [foods, search]);

  const selectedFood = foods.find(f => f.id === foodId) ?? currentFood;

  const startEdit = () => {
    setFoodId(currentFood.id);
    setQuantity(currentQuantity.toString());
    setSearch('');
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = () => {
    const updates: { newFoodId?: string; quantity?: number } = {};
    if (foodId !== currentFood.id) updates.newFoodId = foodId;
    const qNum = Number(quantity);
    if (qNum > 0 && qNum !== currentQuantity) updates.quantity = qNum;
    if (Object.keys(updates).length > 0) onSave(updates);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm group">
        <div className="flex-1 min-w-0">
          <span className="font-medium">{currentFood.name}</span>
          <span className="ml-2 text-muted-foreground">{currentQuantity}g</span>
        </div>
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-60 group-hover:opacity-100"
            onClick={startEdit}
            title="Editar"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:text-destructive opacity-60 group-hover:opacity-100"
            onClick={onRemove}
            title="Remover"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-secondary p-2 space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal h-8">
            <span className="truncate text-xs">{selectedFood.name}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar alimento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-center text-muted-foreground">Nenhum alimento</p>
            ) : (
              filtered.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => setFoodId(food.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary ${
                    foodId === food.id ? 'bg-secondary' : ''
                  }`}
                >
                  <div className="font-medium truncate">{food.name}</div>
                  <div className="text-xs text-muted-foreground">{food.calories} kcal/100g</div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="h-8 flex-1"
          placeholder="Gramas"
        />
        <span className="text-xs text-muted-foreground">g</span>
        <Button variant="outline" size="sm" className="h-8" onClick={cancel}>
          Cancelar
        </Button>
        <Button size="sm" className="h-8 bg-gradient-primary" onClick={save}>
          Salvar
        </Button>
      </div>
    </div>
  );
}

// ─── Slots Manager Dialog ───────────────────────────────────

interface SlotsManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slots: MealSlot[];
  onAdd: (input: { name: string; time?: string }) => Promise<void>;
  onUpdate: (slotId: string, updates: { name?: string; time?: string }) => Promise<void>;
  onDelete: (slotId: string) => void;
  onMove: (slotId: string, direction: -1 | 1) => Promise<void>;
}

function SlotsManagerDialog({ open, onOpenChange, slots, onAdd, onUpdate, onDelete, onMove }: SlotsManagerDialogProps) {
  const [newName, setNewName] = useState('');
  const [newTime, setNewTime] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim() || adding) return;
    setAdding(true);
    try {
      await onAdd({ name: newName.trim(), time: newTime || undefined });
      setNewName('');
      setNewTime('');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Editar Refeições</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Refeições aparecem em todos os dias da semana
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Add form */}
          <div className="rounded-lg border bg-secondary/30 p-3 space-y-2">
            <Label className="text-xs">Nova refeição</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome (ex: Café da manhã)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
              <Input
                placeholder="Hora"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-24"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
              <Button onClick={handleAdd} disabled={!newName.trim() || adding} className="bg-gradient-primary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* List */}
          {slots.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              Nenhuma refeição ainda. Adicione acima.
            </p>
          ) : (
            <div className="space-y-1.5">
              {slots.map((slot, idx) => (
                <SlotEditRow
                  key={slot.id}
                  slot={slot}
                  isFirst={idx === 0}
                  isLast={idx === slots.length - 1}
                  onMove={onMove}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SlotEditRowProps {
  slot: MealSlot;
  isFirst: boolean;
  isLast: boolean;
  onMove: (slotId: string, direction: -1 | 1) => Promise<void>;
  onUpdate: (slotId: string, updates: { name?: string; time?: string }) => Promise<void>;
  onDelete: (slotId: string) => void;
}

function SlotEditRow({ slot, isFirst, isLast, onMove, onUpdate, onDelete }: SlotEditRowProps) {
  const [name, setName] = useState(slot.name);
  const [time, setTime] = useState(slot.time || '');

  // Sync local state when slot prop changes (e.g., after reorder/refresh)
  useEffect(() => {
    setName(slot.name);
    setTime(slot.time || '');
  }, [slot.id, slot.name, slot.time]);

  const commitChanges = () => {
    const updates: { name?: string; time?: string } = {};
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== slot.name) updates.name = trimmedName;
    const normalizedTime = time.trim();
    if (normalizedTime !== (slot.time || '')) updates.time = normalizedTime;
    if (Object.keys(updates).length > 0) onUpdate(slot.id, updates);
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border p-1.5">
      <div className="flex flex-col">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          disabled={isFirst}
          onClick={() => onMove(slot.id, -1)}
          title="Mover para cima"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          disabled={isLast}
          onClick={() => onMove(slot.id, 1)}
          title="Mover para baixo"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitChanges}
        className="h-8 flex-1"
        placeholder="Nome"
      />
      <Input
        value={time}
        onChange={(e) => setTime(e.target.value)}
        onBlur={commitChanges}
        className="h-8 w-20"
        placeholder="Hora"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:text-destructive"
        onClick={() => onDelete(slot.id)}
        title="Apagar"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
