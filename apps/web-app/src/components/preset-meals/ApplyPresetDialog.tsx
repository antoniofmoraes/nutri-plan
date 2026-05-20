import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Aplicar Refeição Pronta</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Selecione em quais refeições da semana deseja aplicar. Os alimentos existentes serão substituídos.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Plano alimentar</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <div key={slot.id} className="rounded-lg border p-3">
                    <p className="text-sm font-semibold mb-2">{slot.name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {weekDays.map(day => {
                        const dayPlan = selectedPlan.days.find(d => d.day === day.value);
                        const meal = dayPlan?.meals.find(m => m.slotId === slot.id);
                        if (!meal) {
                          return (
                            <div key={day.value} className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
                              <span className="w-10">{day.short}</span>
                              <span>—</span>
                            </div>
                          );
                        }
                        return (
                          <label
                            key={day.value}
                            className="flex items-center gap-2 rounded-md border px-2 py-2 text-sm cursor-pointer hover:bg-secondary min-h-[44px]"
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
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left text-xs font-semibold text-muted-foreground">Refeição</th>
                      {weekDays.map(d => (
                        <th key={d.value} className="p-2 text-center text-xs font-semibold text-muted-foreground">{d.short}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orderedSlots.map(slot => (
                      <tr key={slot.id} className="border-b last:border-b-0">
                        <td className="p-2 text-xs font-medium whitespace-nowrap">{slot.name}</td>
                        {weekDays.map(day => {
                          const dayPlan = selectedPlan.days.find(d => d.day === day.value);
                          const meal = dayPlan?.meals.find(m => m.slotId === slot.id);
                          if (!meal) return <td key={day.value} className="p-2 text-center"><span className="text-muted-foreground">—</span></td>;
                          return (
                            <td key={day.value} className="p-2 text-center">
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
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            onClick={handleApply}
            className="bg-gradient-primary"
            disabled={selectedMealIds.size === 0}
          >
            Aplicar ({selectedMealIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
