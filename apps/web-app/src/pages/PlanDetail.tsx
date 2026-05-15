import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, X, Search, Sparkles, CalendarDays, Copy, ChevronUp, ChevronDown } from 'lucide-react';
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
    addSlot,
    updateSlot,
    deleteSlot,
    reorderSlots,
    addFoodToMeal,
    removeFoodFromMeal,
    updateMealFood,
    setMealCheat,
    copyMeal,
    calculateMealMacros,
    calculateDayMacros,
  } = useMealPlan();

  const plan = mealPlans.find((p) => p.id === id);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDay, setSelectedDay] = useState<WeekDay>('segunda');

  // Slot dialog state
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<MealSlot | null>(null);
  const [slotForm, setSlotForm] = useState({ name: '', time: '' });

  // Food dialog state
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [targetMealId, setTargetMealId] = useState<string | null>(null);
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [foodQuantity, setFoodQuantity] = useState('100');
  const [foodSearch, setFoodSearch] = useState('');

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

  const handleOpenSlotDialog = (slot?: MealSlot) => {
    if (slot) {
      setEditingSlot(slot);
      setSlotForm({ name: slot.name, time: slot.time || '' });
    } else {
      setEditingSlot(null);
      setSlotForm({ name: '', time: '' });
    }
    setSlotDialogOpen(true);
  };

  const handleSaveSlot = async () => {
    if (!slotForm.name.trim()) return;
    if (editingSlot) {
      await updateSlot(plan.id, editingSlot.id, {
        name: slotForm.name,
        time: slotForm.time || undefined,
      });
    } else {
      await addSlot(plan.id, {
        name: slotForm.name,
        time: slotForm.time || undefined,
      });
    }
    setSlotDialogOpen(false);
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
    setSelectedFoodId('');
    setFoodQuantity('100');
    setFoodSearch('');
    setFoodDialogOpen(true);
  };

  const handleAddFood = async () => {
    if (!targetMealId || !selectedFoodId) return;
    const food = foods.find((f) => f.id === selectedFoodId);
    if (!food) return;
    await addFoodToMeal(plan.id, targetMealId, food, Number(foodQuantity));
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
        <Button onClick={() => handleOpenSlotDialog()} className="bg-gradient-primary">
          <Plus className="mr-1 h-4 w-4" />
          Refeição
        </Button>
      </div>

      {/* Slot management chips */}
      {plan.slots.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display">Refeições do plano</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[...plan.slots].sort((a, b) => a.sortOrder - b.sortOrder).map((slot, idx, arr) => (
              <div key={slot.id} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  disabled={idx === 0}
                  onClick={() => handleMoveSlot(slot.id, -1)}
                  title="Mover para cima"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  disabled={idx === arr.length - 1}
                  onClick={() => handleMoveSlot(slot.id, 1)}
                  title="Mover para baixo"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <span className="font-medium">{slot.name}</span>
                {slot.time && <span className="text-xs text-muted-foreground">• {slot.time}</span>}
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={() => handleOpenSlotDialog(slot)}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-destructive" onClick={() => handleDeleteSlot(slot.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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

      {/* Slot Dialog */}
      <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingSlot ? 'Editar Refeição' : 'Nova Refeição'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Refeição</Label>
              <Input
                placeholder="Ex: Café da manhã"
                value={slotForm.name}
                onChange={(e) => setSlotForm({ ...slotForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Horário (opcional)</Label>
              <Input
                placeholder="Ex: 07:00"
                value={slotForm.time}
                onChange={(e) => setSlotForm({ ...slotForm, time: e.target.value })}
              />
            </div>
            {!editingSlot && (
              <p className="text-xs text-muted-foreground">
                Essa refeição será criada em todos os dias da semana.
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSaveSlot} className="bg-gradient-primary">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Food Dialog */}
      <Dialog open={foodDialogOpen} onOpenChange={setFoodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Adicionar Alimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x">
      {weekDays.map((day) => {
        const dayPlan = plan.days.find(d => d.day === day.value);
        const dayMacros = dayPlan ? calculateDayMacros(dayPlan) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

        return (
          <div key={day.value} className="flex flex-col p-3">
            <button
              type="button"
              onClick={() => onDayClick(day.value)}
              className="text-left hover:opacity-80 transition-opacity mb-2"
            >
              <div className="text-sm font-display font-bold flex items-baseline justify-between gap-1">
                <span>{day.label}</span>
                <span className="text-xs font-normal text-accent">
                  {dayMacros.calories.toFixed(0)} kcal
                </span>
              </div>
              <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground">
                <span>P: {dayMacros.protein.toFixed(0)}g</span>
                <span>C: {dayMacros.carbs.toFixed(0)}g</span>
                <span>G: {dayMacros.fat.toFixed(0)}g</span>
              </div>
            </button>
            <div className="flex-1 space-y-2">
              {plan.slots.map((slot) => {
                const meal = dayPlan?.meals.find(m => m.slotId === slot.id);
                if (!meal) return null;
                const macros = calculateMealMacros(meal);
                return (
                  <div
                    key={slot.id}
                    className={`rounded-md border p-2 flex flex-col gap-1 ${
                      meal.isCheat ? 'border-accent/40 bg-accent/5' : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{slot.name}</p>
                        {slot.time && (
                          <p className="text-[10px] text-muted-foreground">{slot.time}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-accent font-medium flex-shrink-0">
                        {macros.calories.toFixed(0)}
                      </span>
                    </div>

                    {meal.isCheat ? (
                      <>
                        <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full self-start flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" /> Livre
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] justify-start px-1"
                          onClick={() => onToggleCheat(meal.id, true)}
                        >
                          Desmarcar
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-0.5">
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
                        <div className="flex gap-1">
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
                );
              })}

              {plan.slots.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-4">
                  Sem refeições
                </p>
              )}
            </div>
          </div>
        );
      })}
        </div>
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
