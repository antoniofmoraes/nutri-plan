import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { weekDays } from '@/lib/constants';
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
  const orderedSlots = selectedPlan
    ? [...selectedPlan.slots].sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

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
              className="flex h-10 w-full rounded-[var(--r-md)] border border-line bg-surface px-3 py-2 text-[13.5px] focus:outline-none focus:border-ink transition-[border-color] duration-[120ms]"
              value={selectedPlanId}
              onChange={(e) => handleSelectPlan(e.target.value)}
            >
              {mealPlans.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedPlan && orderedSlots.length > 0 && (
            <>
              {/* Mobile */}
              <div className="space-y-3 md:hidden">
                {orderedSlots.map(slot => (
                  <div key={slot.id} className="rounded-[var(--r-md)] border border-line p-3">
                    <p className="text-[13px] font-semibold mb-2">{slot.name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {weekDays.map(day => {
                        const dayPlan = selectedPlan.days.find(d => d.day === day.value);
                        const meal = dayPlan?.meals.find(m => m.slotId === slot.id);
                        if (!meal) {
                          return (
                            <div key={day.value} className="flex items-center gap-2 px-2 py-2 text-[12.5px] text-muted">
                              <span className="w-10">{day.short}</span>
                              <span>—</span>
                            </div>
                          );
                        }
                        return (
                          <label
                            key={day.value}
                            className="flex items-center gap-2 rounded-[var(--r-sm)] border border-line px-2 py-2 text-[12.5px] cursor-pointer hover:bg-surface-alt min-h-[44px] transition-[background] duration-[120ms]"
                          >
                            <Checkbox
                              checked={selectedMealIds.has(meal.id)}
                              onCheckedChange={() => toggleMealId(meal.id)}
                            />
                            <span>{day.short}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto border border-line rounded-[var(--r-md)]">
                <table className="w-full border-collapse text-[12.5px]">
                  <thead>
                    <tr className="border-b border-line bg-surface-alt">
                      <th className="p-2.5 text-left eyebrow">Refeição</th>
                      {weekDays.map(d => (
                        <th key={d.value} className="p-2.5 text-center eyebrow">{d.short}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orderedSlots.map(slot => (
                      <tr key={slot.id} className="border-b border-line last:border-b-0">
                        <td className="p-2.5 font-medium whitespace-nowrap">{slot.name}</td>
                        {weekDays.map(day => {
                          const dayPlan = selectedPlan.days.find(d => d.day === day.value);
                          const meal = dayPlan?.meals.find(m => m.slotId === slot.id);
                          if (!meal) return <td key={day.value} className="p-2.5 text-center"><span className="text-muted">—</span></td>;
                          return (
                            <td key={day.value} className="p-2.5 text-center">
                              <Checkbox
                                checked={selectedMealIds.has(meal.id)}
                                onCheckedChange={() => toggleMealId(meal.id)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
