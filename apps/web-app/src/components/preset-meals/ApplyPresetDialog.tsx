import { useState } from 'react';
import { CalendarPlus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MealSlotGrid } from '@/components/shared/MealSlotGrid';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { weekDays } from '@/lib/constants';
import { calculateFoodsMacros } from '@/lib/macros';
import { ApiError } from '@/lib/api';
import type { MealPlan, PresetMeal, Meal } from '@/types';

interface ApplyPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset: PresetMeal | null;
  mealPlans: MealPlan[];
  isLoadingPlans?: boolean;
  onApply: (planId: string, mealIds: string[]) => void | Promise<void>;
  onCreatePlan?: () => void;
}

/// A casca só decide se o diálogo está aberto. O estado de seleção mora no formulário,
/// que o Radix desmonta ao fechar — então cada abertura nasce limpa, sem efeito de reset.
export function ApplyPresetDialog({
  open,
  onOpenChange,
  preset,
  mealPlans,
  isLoadingPlans,
  onApply,
  onCreatePlan,
}: ApplyPresetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent lg>
        <ApplyPresetForm
          preset={preset}
          mealPlans={mealPlans}
          isLoadingPlans={isLoadingPlans}
          onApply={onApply}
          onClose={() => onOpenChange(false)}
          onCreatePlan={onCreatePlan}
        />
      </DialogContent>
    </Dialog>
  );
}

function mealLabel(plan: MealPlan, meal: Meal): string {
  const day = plan.days.find((d) => d.meals.some((m) => m.id === meal.id));
  const dayLabel = weekDays.find((d) => d.value === day?.day)?.short ?? '';
  const slotName = plan.slots.find((s) => s.id === meal.slotId)?.name ?? 'Refeição';
  return `${slotName} · ${dayLabel}`;
}

function ApplyPresetForm({
  preset,
  mealPlans,
  isLoadingPlans,
  onApply,
  onClose,
  onCreatePlan,
}: {
  preset: PresetMeal | null;
  mealPlans: MealPlan[];
  isLoadingPlans?: boolean;
  onApply: (planId: string, mealIds: string[]) => void | Promise<void>;
  onClose: () => void;
  onCreatePlan?: () => void;
}) {
  // Só a escolha explícita vira estado. O padrão é derivado a cada render, então continua
  // correto mesmo quando os planos chegam depois da abertura do diálogo.
  const [pickedPlanId, setPickedPlanId] = useState<string | null>(null);
  const [selectedMealIds, setSelectedMealIds] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const defaultPlan = mealPlans.find((p) => p.isMain) ?? mealPlans[0] ?? null;
  const selectedPlan = mealPlans.find((p) => p.id === pickedPlanId) ?? defaultPlan;

  const planMeals = selectedPlan?.days.flatMap((d) => d.meals) ?? [];
  // D9 vira validação: só submete refeição que pertence ao plano efetivo.
  const targets = planMeals.filter((m) => selectedMealIds.has(m.id));
  const cheatTargets = targets.filter((m) => m.isCheat);
  const overwriteTargets = targets.filter((m) => !m.isCheat && m.foods.length > 0);

  const allMealIds = planMeals.map((m) => m.id);
  const allSelected = allMealIds.length > 0 && allMealIds.every((id) => selectedMealIds.has(id));

  const handleSelectPlan = (id: string) => {
    setPickedPlanId(id);
    // Refeições são de outro plano: manter a seleção não faz sentido, e o aviso evita
    // que o descarte pareça um bug (R6).
    if (selectedMealIds.size > 0) {
      setSelectedMealIds(new Set());
      setError('A seleção foi limpa porque as refeições pertencem a outro plano.');
    }
  };

  const toggleMealId = (id: string) => {
    setError(null);
    setSelectedMealIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setError(null);
    setSelectedMealIds((prev) => {
      const next = new Set(prev);
      allMealIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const submit = async () => {
    if (!selectedPlan || targets.length === 0 || cheatTargets.length > 0) return;
    setApplying(true);
    setError(null);
    try {
      await onApply(selectedPlan.id, targets.map((m) => m.id));
      onClose();
    } catch (err) {
      // Mantém o diálogo aberto com a seleção intacta (R8).
      setConfirming(false);
      setError(err instanceof ApiError ? err.message : 'Não foi possível aplicar a refeição pronta');
    } finally {
      setApplying(false);
    }
  };

  const handlePrimary = () => {
    if (overwriteTargets.length > 0) {
      setConfirming(true);
      return;
    }
    void submit();
  };

  if (isLoadingPlans) {
    return (
      <>
        <ApplyHeader preset={preset} />
        <DialogBody>
          <LoadingState label="Carregando planos…" />
        </DialogBody>
      </>
    );
  }

  if (mealPlans.length === 0) {
    return (
      <>
        <ApplyHeader preset={preset} />
        <DialogBody>
          <EmptyState
            icon={CalendarPlus}
            title="Nenhum plano alimentar"
            description="Crie um plano para poder aplicar suas refeições prontas nele."
            action={onCreatePlan ? <Button variant="acc" onClick={onCreatePlan}>Criar plano</Button> : undefined}
          />
        </DialogBody>
      </>
    );
  }

  // Etapa de confirmação dentro do mesmo diálogo, em vez de um segundo modal empilhado:
  // em 375px dois modais sobrepostos ficam apertados, e voltar preserva a seleção de graça
  // por ser o mesmo componente.
  if (confirming && selectedPlan) {
    return (
      <>
        <DialogHeader className="pr-12">
          <DialogTitle>Substituir alimentos existentes?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-ink break-words">“{preset?.name}”</span> vai
            substituir os alimentos destas refeições em{' '}
            <span className="font-medium text-ink break-words">“{selectedPlan.name}”</span>.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <ul className="rounded-[var(--r-md)] border border-line divide-y divide-line">
            {overwriteTargets.map((meal) => (
              <li key={meal.id} className="flex justify-between gap-3 px-3 py-2 text-[13px]">
                <span className="truncate">{mealLabel(selectedPlan, meal)}</span>
                <span className="num text-[11.5px] text-muted flex-shrink-0">
                  {meal.foods.length} {meal.foods.length === 1 ? 'alimento' : 'alimentos'}
                </span>
              </li>
            ))}
          </ul>
          <p className="flex items-start gap-2 text-[12.5px] text-muted">
            <AlertTriangle size={14} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={1.8} />
            As outras{' '}
            <span className="num">{targets.length - overwriteTargets.length}</span> refeições
            selecionadas estão vazias e apenas recebem os alimentos.
          </p>
          {error && <p role="alert" className="text-[12.5px] text-danger">{error}</p>}
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" className={"h-11 sm:h-9"} onClick={() => setConfirming(false)} disabled={applying}>
            Voltar
          </Button>
          <Button variant="danger" className={"h-11 sm:h-9"} onClick={() => void submit()} disabled={applying}>
            {applying ? 'Substituindo…' : 'Substituir'}
          </Button>
        </DialogFooter>
      </>
    );
  }

  const macros = preset ? calculateFoodsMacros(preset.foods) : null;

  return (
    <>
      <ApplyHeader preset={preset} />

      <DialogBody>
        {/* R3: dá para ver o que será gravado sem fechar o diálogo. */}
        {preset && macros && (
          <div className="rounded-[var(--r-md)] border border-line bg-surface-alt p-3">
            <div className="eyebrow mb-1.5">Será aplicado</div>
            <div className="mono flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-muted">
              <span className="num font-medium" style={{ color: 'var(--m-cal)' }}>
                {macros.calories.toFixed(0)} kcal
              </span>
              <span>P {macros.protein.toFixed(0)}g</span>
              <span>C {macros.carbs.toFixed(0)}g</span>
              <span>G {macros.fat.toFixed(0)}g</span>
            </div>
            {preset.foods.length === 0 ? (
              <p className="text-[12.5px] text-muted mt-2 italic">Sem alimentos</p>
            ) : (
              <ul className="mt-2 space-y-0.5">
                {preset.foods.map(({ food, quantity }) => (
                  <li key={food.id} className="text-[12.5px] flex justify-between gap-3">
                    <span className="truncate">{food.name}</span>
                    <span className="num text-muted flex-shrink-0">{quantity}g</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div>
          <label className="label-mono">Plano alimentar</label>
          <Select value={selectedPlan?.id ?? ''} onValueChange={handleSelectPlan}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um plano" />
            </SelectTrigger>
            <SelectContent>
              {mealPlans.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPlan && selectedPlan.slots.length > 0 ? (
          <MealSlotGrid
            plan={selectedPlan}
            selectedMealIds={selectedMealIds}
            onToggleMeal={toggleMealId}
            showSelectAll
            onToggleAll={toggleAll}
            allSelected={allSelected}
            showMealState
          />
        ) : (
          <p className="text-[13px] text-muted">
            Este plano ainda não tem refeições configuradas.
          </p>
        )}

        {cheatTargets.length > 0 && selectedPlan && (
          <p role="alert" className="text-[12.5px] text-danger">
            Refeição livre não recebe refeição pronta. Desmarque{' '}
            {cheatTargets.map((m) => mealLabel(selectedPlan, m)).join(', ')} para aplicar.
          </p>
        )}

        {error && <p role="alert" className="text-[12.5px] text-danger">{error}</p>}
      </DialogBody>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost" className={"h-11 sm:h-9"}>Cancelar</Button>
        </DialogClose>
        <Button
          variant="acc"
          className={"h-11 sm:h-9"}
          onClick={handlePrimary}
          disabled={targets.length === 0 || cheatTargets.length > 0 || applying}
        >
          {applying ? (
            'Aplicando…'
          ) : targets.length === 0 ? (
            'Aplicar'
          ) : (
            <>
              Aplicar em <span className="num">{targets.length}</span>{' '}
              {targets.length === 1 ? 'refeição' : 'refeições'}
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

function ApplyHeader({ preset }: { preset: PresetMeal | null }) {
  return (
    /* pr-12 reserva o botão de fechar (absolute right-4, 30px), que sobrepõe o header */
    <DialogHeader className="pr-12">
      <DialogTitle>Aplicar refeição pronta</DialogTitle>
      <DialogDescription>
        Selecione as refeições da semana que vão receber{' '}
        <span className="font-medium text-ink break-words">“{preset?.name}”</span>. Os
        alimentos que já existirem nelas serão substituídos.
      </DialogDescription>
    </DialogHeader>
  );
}
