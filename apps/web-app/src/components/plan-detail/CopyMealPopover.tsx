import { useState } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import type { MealPlan, Meal, WeekDay } from '@/types';
import { weekDays } from './types';

interface CopyMealPopoverProps {
  plan: MealPlan;
  meal: Meal;
  currentDay: WeekDay;
  onCopy: (targetMealIds: string[]) => void;
}

export function CopyMealPopover({ plan, meal, currentDay, onCopy }: CopyMealPopoverProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
      <PopoverContent className="w-[min(14rem,90vw)] p-2" align="start">
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
