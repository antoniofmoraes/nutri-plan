import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { MealSlotGrid } from '@/components/shared/MealSlotGrid';
import type { MealPlan } from '@/types';

interface ApplyPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealPlans: MealPlan[];
  onApply: (planId: string, mealIds: string[]) => void;
}

export function ApplyPresetDialog({
  open,
  onOpenChange,
  mealPlans,
  onApply,
}: ApplyPresetDialogProps) {
  const [selectedPlanId, setSelectedPlanId] = useState(() =>
    mealPlans.length > 0 ? mealPlans[0].id : ''
  );
  const [selectedMealIds, setSelectedMealIds] = useState<Set<string>>(new Set());

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setSelectedPlanId(mealPlans.length > 0 ? mealPlans[0].id : '');
      setSelectedMealIds(new Set());
    }
    onOpenChange(next);
  };

  const handleSelectPlan = (id: string) => {
    setSelectedPlanId(id);
    setSelectedMealIds(new Set());
  };

  const toggleMealId = (id: string) => {
    setSelectedMealIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApply = () => {
    if (!selectedPlanId || selectedMealIds.size === 0) return;
    onApply(selectedPlanId, Array.from(selectedMealIds));
    onOpenChange(false);
  };

  const selectedPlan = mealPlans.find(p => p.id === selectedPlanId);

  const allMealIds = selectedPlan
    ? selectedPlan.days.flatMap(d => d.meals.map(m => m.id))
    : [];
  const allSelected = allMealIds.length > 0 && allMealIds.every(id => selectedMealIds.has(id));

  const toggleAll = () => {
    setSelectedMealIds(prev => {
      const next = new Set(prev);
      allMealIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent lg>
        <DialogHeader>
          <DialogTitle>Aplicar refeição pronta</DialogTitle>
          <DialogDescription>
            Selecione em quais refeições da semana deseja aplicar. Os alimentos existentes serão substituídos.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div>
            <label className="label-mono">Plano alimentar</label>
            <select
              className="flex h-10 w-full rounded-[var(--r-md)] border border-line bg-surface px-3 py-2 text-[13.5px] focus:outline-none focus:border-ink transition-[border-color] duration-120"
              value={selectedPlanId}
              onChange={(e) => handleSelectPlan(e.target.value)}
            >
              {mealPlans.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedPlan && selectedPlan.slots.length > 0 && (
            <MealSlotGrid
              plan={selectedPlan}
              selectedMealIds={selectedMealIds}
              onToggleMeal={toggleMealId}
              showSelectAll
              onToggleAll={toggleAll}
              allSelected={allSelected}
            />
          )}
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </DialogClose>
          <Button
            variant="acc"
            onClick={handleApply}
            disabled={selectedMealIds.size === 0}
          >
            Aplicar ({selectedMealIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
