import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, CalendarRange, LogOut, Download, FileText, FileType, FileCode, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { mealPlanService } from '@/services/mealPlanService';
import { useMealPlan, useMealPlanSharing } from '@/hooks/useMealPlans';
import { useAllFoods } from '@/hooks/useFoods';
import { usePresetMeals } from '@/hooks/usePresetMeals';
import { calculateMealMacros, calculateDayMacros } from '@/lib/macros';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Food, WeekDay, PlanGoal } from '@/types';
import { WeekView } from '@/components/plan-detail/WeekView';
import { DayView } from '@/components/plan-detail/DayView';
import { SlotsManagerDialog } from '@/components/plan-detail/SlotsManagerDialog';
import { AddFoodDialog } from '@/components/plan-detail/AddFoodDialog';
import { ShareDialog } from '@/components/plan-sharing/ShareDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ViewMode = 'week' | 'day';

const goalLabels: Record<PlanGoal, string> = {
  manter: 'Manutenção',
  ganhar: 'Ganho de Massa',
  emagrecer: 'Emagrecimento',
};

export default function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    plan, addSlot, updateSlot, deleteSlot, reorderSlots,
    addFoodToMeal, removeFoodFromMeal, updateMealFood,
    setMealCheat, copyMeal, applyPreset,
  } = useMealPlan(id);
  const sharing = useMealPlanSharing(id);
  const { foods } = useAllFoods();
  const { presetMeals } = usePresetMeals();
  const isMobile = useIsMobile();
  const isOwner = plan?.role === 'owner';
  const canEditPlan = plan?.canEdit ?? false;
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const effectiveViewMode: ViewMode = isMobile ? 'day' : viewMode;
  const [selectedDay, setSelectedDay] = useState<WeekDay>('segunda');

  const [slotsManagerOpen, setSlotsManagerOpen] = useState(false);
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [targetMealId, setTargetMealId] = useState<string | null>(null);

  if (!plan) {
    return (
      <div className="bg-surface border border-line rounded-lg shadow-1 p-12 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-lg bg-accent-soft text-accent grid place-items-center mb-4">
          <CalendarRange size={26} strokeWidth={1.6} />
        </div>
        <h3 className="text-[19px] font-semibold mb-1.5">Plano não encontrado</h3>
        <p className="text-muted max-w-[360px] mb-5">
          Este plano pode ter sido excluído.
        </p>
        <Button variant="acc" onClick={() => navigate('/planos')}>Voltar para Planos</Button>
      </div>
    );
  }

  const handleAddSlot = async (input: { name: string; time?: string }) => {
    await addSlot(input);
  };
  const handleUpdateSlot = async (slotId: string, updates: { name?: string; time?: string }) => {
    await updateSlot(slotId, updates);
  };
  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Apagar essa refeição de todos os dias?')) return;
    await deleteSlot(slotId);
  };
  const handleMoveSlot = async (slotId: string, direction: -1 | 1) => {
    const orderedSlots = [...plan.slots].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = orderedSlots.findIndex(s => s.id === slotId);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= orderedSlots.length) return;
    [orderedSlots[idx], orderedSlots[target]] = [orderedSlots[target], orderedSlots[idx]];
    await reorderSlots(orderedSlots.map(s => s.id));
  };
  const handleOpenFoodDialog = (mealId: string) => {
    setTargetMealId(mealId);
    setFoodDialogOpen(true);
  };
  const handleAddFood = async (food: Food, quantity: number) => {
    if (!targetMealId) return;
    await addFoodToMeal(targetMealId, food, quantity);
  };
  const handleApplyPreset = async (presetId: string) => {
    if (!targetMealId) return;
    await applyPreset(presetId, [targetMealId]);
  };
  const handleRemoveFood = async (mealId: string, foodId: string) => {
    await removeFoodFromMeal(mealId, foodId);
  };
  const handleUpdateFood = async (mealId: string, foodId: string, updates: { newFoodId?: string; quantity?: number }) => {
    await updateMealFood(mealId, foodId, updates);
  };
  const handleToggleCheat = async (mealId: string, currentlyCheat: boolean) => {
    try {
      await setMealCheat(mealId, !currentlyCheat);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar');
    }
  };
  const handleCopyMeal = async (sourceMealId: string, targetMealIds: string[]) => {
    if (targetMealIds.length === 0) return;
    try {
      await copyMeal(sourceMealId, targetMealIds);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao copiar');
    }
  };
  const handleLeaveShare = async () => {
    if (!confirm('Sair deste plano compartilhado?')) return;
    try {
      await sharing.leaveShare();
      toast.success('Você saiu do plano');
      navigate('/planos');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao sair do plano');
    }
  };
  const goToDayView = (day: WeekDay) => {
    setSelectedDay(day);
    setViewMode('day');
  };

  const handleExport = async (format: 'md' | 'docx' | 'pdf') => {
    try {
      await mealPlanService.downloadExport(plan.id, plan.name, format);
    } catch {
      toast.error('Erro ao exportar plano');
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      await mealPlanService.copyMarkdownExport(plan.id);
      toast.success('Markdown copiado para a área de transferência');
    } catch {
      toast.error('Erro ao copiar markdown');
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <Link
            to="/planos"
            className="eyebrow inline-flex items-center gap-1 mb-2 hover:text-ink transition-colors"
          >
            ← PLANOS
          </Link>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[32px] font-bold tracking-[-0.02em] leading-[1.1]">
              {plan.name}
            </h1>
            {plan.isMain && (
              <Star size={20} fill="var(--accent)" className="text-accent" />
            )}
          </div>
          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
            <Badge variant="accent">{goalLabels[plan.goal]}</Badge>
            {!isOwner && (
              <Badge variant="secondary">
                Compartilhado por {plan.ownerName}
              </Badge>
            )}
            {!isOwner && !canEditPlan && (
              <Badge variant="outline">Somente leitura</Badge>
            )}
            <span className="mono text-[11.5px] text-muted">
              {plan.dailyCalories.toLocaleString("pt-BR")} kcal/dia · {plan.slots.length} refeições
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {!isMobile && (
            <div className="inline-flex bg-surface-alt border border-line rounded-[var(--r-md)] p-[3px] gap-0.5">
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  'px-3.5 py-1.5 rounded-[7px] text-[13px] font-medium transition-[background,color,box-shadow] duration-[120ms]',
                  effectiveViewMode === 'week'
                    ? 'bg-surface text-ink shadow-1'
                    : 'text-muted hover:text-ink'
                )}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={cn(
                  'px-3.5 py-1.5 rounded-[7px] text-[13px] font-medium transition-[background,color,box-shadow] duration-[120ms]',
                  effectiveViewMode === 'day'
                    ? 'bg-surface text-ink shadow-1'
                    : 'text-muted hover:text-ink'
                )}
              >
                Dia
              </button>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="sec" size="sm">
                <Download size={14} />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyMarkdown}>
                <Clipboard size={14} className="mr-2" />
                Copiar Markdown
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('md')}>
                <FileCode size={14} className="mr-2" />
                Baixar Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('docx')}>
                <FileText size={14} className="mr-2" />
                Word (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileType size={14} className="mr-2" />
                PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isOwner && <ShareDialog plan={plan} />}
          {canEditPlan && (
            <Button variant="sec" onClick={() => setSlotsManagerOpen(true)}>
              Editar refeições
            </Button>
          )}
          {!isOwner && (
            <Button variant="outline" size="sm" onClick={handleLeaveShare}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {plan.slots.length === 0 ? (
        <div className="bg-surface border border-line rounded-lg shadow-1 p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-lg bg-accent-soft text-accent grid place-items-center mb-4">
            <CalendarRange size={26} strokeWidth={1.6} />
          </div>
          <h3 className="text-[19px] font-semibold mb-1.5">Sem refeições</h3>
          <p className="text-muted max-w-[360px] mb-5">
            Adicione uma refeição para começar (Café da manhã, Almoço, …)
          </p>
          {canEditPlan && (
            <Button variant="acc" onClick={() => setSlotsManagerOpen(true)}>
              Editar refeições
            </Button>
          )}
        </div>
      ) : effectiveViewMode === 'week' ? (
        <WeekView
          plan={plan}
          readOnly={!canEditPlan}
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
          readOnly={!canEditPlan}
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
