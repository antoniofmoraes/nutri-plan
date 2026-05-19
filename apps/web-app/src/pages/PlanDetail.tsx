import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMealPlan } from '@/contexts/MealPlanContext';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Food, WeekDay } from '@/types';
import { weekDays } from '@/components/plan-detail/types';
import { WeekView } from '@/components/plan-detail/WeekView';
import { DayView } from '@/components/plan-detail/DayView';
import { SlotsManagerDialog } from '@/components/plan-detail/SlotsManagerDialog';
import { AddFoodDialog } from '@/components/plan-detail/AddFoodDialog';

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
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const effectiveViewMode: ViewMode = isMobile ? 'day' : viewMode;
  const [selectedDay, setSelectedDay] = useState<WeekDay>('segunda');

  const [slotsManagerOpen, setSlotsManagerOpen] = useState(false);

  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [targetMealId, setTargetMealId] = useState<string | null>(null);

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
    setFoodDialogOpen(true);
  };

  const handleAddFood = async (food: Food, quantity: number) => {
    if (!targetMealId) return;
    await addFoodToMeal(plan.id, targetMealId, food, quantity);
  };

  const handleApplyPreset = async (presetId: string) => {
    if (!targetMealId) return;
    await applyPreset(plan.id, presetId, [targetMealId]);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap sm:gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/planos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground font-display truncate">{plan.name}</h1>
            <p className="text-sm text-muted-foreground">
              {effectiveViewMode === 'week' ? 'Visão semanal' : `Visão diária — ${weekDays.find(d => d.value === selectedDay)?.label}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isMobile && viewMode === 'day' && (
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
      </div>

      {plan.slots.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-muted p-10 text-center">
          <p className="text-muted-foreground">
            Adicione uma refeição para começar (Café da manhã, Almoço, …)
          </p>
        </div>
      ) : effectiveViewMode === 'week' ? (
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

      <AddFoodDialog
        open={foodDialogOpen}
        onOpenChange={setFoodDialogOpen}
        foods={foods}
        presetMeals={presetMeals}
        onAddFood={handleAddFood}
        onApplyPreset={handleApplyPreset}
      />
    </div>
  );
}
