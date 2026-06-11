import { Checkbox } from '@/components/ui/checkbox';
import { weekDays } from '@/lib/constants';
import type { MealPlan } from '@/types';

interface MealSlotGridProps {
  plan: MealPlan;
  selectedMealIds: Set<string>;
  onToggleMeal: (mealId: string) => void;
  showSelectAll?: boolean;
  onToggleAll?: () => void;
  allSelected?: boolean;
}

export function MealSlotGrid({
  plan,
  selectedMealIds,
  onToggleMeal,
  showSelectAll,
  onToggleAll,
  allSelected,
}: MealSlotGridProps) {
  const orderedSlots = [...plan.slots].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {showSelectAll && onToggleAll && (
          <label className="flex items-center gap-2.5 text-[13px] font-medium cursor-pointer px-3 py-3 hover:bg-surface-alt rounded-[var(--r-sm)] transition-[background] duration-120 min-h-[48px]">
            <Checkbox checked={allSelected} onCheckedChange={onToggleAll} className="h-5 w-5" />
            <span>Selecionar tudo</span>
          </label>
        )}
        {orderedSlots.map(slot => (
          <div key={slot.id} className="rounded-[var(--r-md)] border border-line p-3">
            <p className="text-[13px] font-semibold mb-2">{slot.name}</p>
            <div className="grid grid-cols-2 gap-2">
              {weekDays.map(day => {
                const dayPlan = plan.days.find(d => d.day === day.value);
                const meal = dayPlan?.meals.find(m => m.slotId === slot.id);
                if (!meal) {
                  return (
                    <div key={day.value} className="flex items-center gap-2.5 px-3 py-3 text-[12.5px] text-muted">
                      <span className="w-10">{day.short}</span>
                      <span>—</span>
                    </div>
                  );
                }
                return (
                  <label
                    key={day.value}
                    className="flex items-center gap-2.5 rounded-[var(--r-sm)] border border-line px-3 py-3 text-[13px] cursor-pointer hover:bg-surface-alt min-h-[48px] transition-[background] duration-120"
                  >
                    <Checkbox
                      checked={selectedMealIds.has(meal.id)}
                      onCheckedChange={() => onToggleMeal(meal.id)}
                      className="h-5 w-5"
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
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line bg-surface-alt">
              <th className="p-3 text-left eyebrow">
                {showSelectAll && onToggleAll ? (
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <Checkbox checked={allSelected} onCheckedChange={onToggleAll} className="h-5 w-5" />
                    <span>Refeição</span>
                  </label>
                ) : (
                  <span>Refeição</span>
                )}
              </th>
              {weekDays.map(d => (
                <th key={d.value} className="p-3 text-center eyebrow">{d.short}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedSlots.map(slot => (
              <tr key={slot.id} className="border-b border-line last:border-b-0">
                <td className="p-3 font-medium whitespace-nowrap">{slot.name}</td>
                {weekDays.map(day => {
                  const dayPlan = plan.days.find(d => d.day === day.value);
                  const meal = dayPlan?.meals.find(m => m.slotId === slot.id);
                  if (!meal) {
                    return (
                      <td key={day.value} className="p-3 text-center">
                        <span className="text-muted">—</span>
                      </td>
                    );
                  }
                  return (
                    <td key={day.value} className="p-3 text-center">
                      <label className="inline-grid place-items-center w-10 h-10 cursor-pointer rounded-[var(--r-sm)] hover:bg-surface-alt transition-[background] duration-120">
                        <Checkbox
                          checked={selectedMealIds.has(meal.id)}
                          onCheckedChange={() => onToggleMeal(meal.id)}
                          className="h-5 w-5"
                        />
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
