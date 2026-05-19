import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, CalendarDays, Settings2, BookCopy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMealPlan } from '@/contexts/MealPlanContext';
import { WeekDay } from '@/types';
import { weekDays } from '@/components/plan-detail/types';
import { WeekView } from '@/components/plan-detail/WeekView';
import { DayView } from '@/components/plan-detail/DayView';
import { SlotsManagerDialog } from '@/components/plan-detail/SlotsManagerDialog';

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

  const [slotsManagerOpen, setSlotsManagerOpen] = useState(false);

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
