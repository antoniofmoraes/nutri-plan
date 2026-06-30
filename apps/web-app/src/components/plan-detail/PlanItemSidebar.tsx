import { useMemo, useState } from 'react';
import { BookCopy, GripVertical, Search, Utensils } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { calculateFoodMacros, calculateFoodsMacros, getFoodPortionGrams } from '@/lib/macros';
import { cn } from '@/lib/utils';
import type { Food, PresetMeal } from '@/types';
import { encodePlanItemDragPayload, PLAN_ITEM_DRAG_TYPE } from './dragPayload';

interface PlanItemSidebarProps {
  foods: Food[];
  presetMeals: PresetMeal[];
  className?: string;
}

type LibraryMode = 'food' | 'preset';

export function PlanItemSidebar({ foods, presetMeals, className }: PlanItemSidebarProps) {
  const [mode, setMode] = useState<LibraryMode>('food');
  const [search, setSearch] = useState('');
  const normalizedSearch = search.trim().toLowerCase();

  const filteredFoods = useMemo(
    () =>
      foods
        .filter((food) => food.name.toLowerCase().includes(normalizedSearch))
        .slice(0, 80),
    [foods, normalizedSearch]
  );

  const filteredPresets = useMemo(
    () =>
      presetMeals.filter((preset) =>
        preset.name.toLowerCase().includes(normalizedSearch) ||
        preset.foods.some(({ food }) => food.name.toLowerCase().includes(normalizedSearch))
      ),
    [presetMeals, normalizedSearch]
  );

  const visibleCount = mode === 'food' ? filteredFoods.length : filteredPresets.length;

  return (
    <aside className={cn('bg-surface border border-line rounded-lg shadow-1 p-4 space-y-3 lg:sticky lg:top-6', className)}>
      <div>
        <div className="eyebrow">Biblioteca</div>
        <h2 className="text-[18px] font-semibold leading-tight">Alimentos e refeições</h2>
      </div>

      <div className="inline-flex bg-surface-alt border border-line rounded-[var(--r-md)] p-[3px] gap-0.5 w-full">
        <button
          type="button"
          onClick={() => setMode('food')}
          className={cn(
            'flex-1 px-3 py-1.5 rounded-[7px] text-[13px] font-medium transition-[background,color,box-shadow] duration-120 inline-flex items-center justify-center gap-1.5',
            mode === 'food'
              ? 'bg-surface text-ink shadow-1'
              : 'text-muted hover:text-ink'
          )}
        >
          <Utensils size={13} />
          Alimentos
        </button>
        <button
          type="button"
          onClick={() => setMode('preset')}
          className={cn(
            'flex-1 px-3 py-1.5 rounded-[7px] text-[13px] font-medium transition-[background,color,box-shadow] duration-120 inline-flex items-center justify-center gap-1.5',
            mode === 'preset'
              ? 'bg-surface text-ink shadow-1'
              : 'text-muted hover:text-ink'
          )}
        >
          <BookCopy size={13} />
          Refeições
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={mode === 'food' ? 'Buscar alimentos...' : 'Buscar refeições...'}
          className="pl-9"
        />
      </div>

      <ScrollArea className="h-[320px] lg:h-[calc(100vh-290px)] lg:max-h-[520px]">
        {visibleCount === 0 ? (
          <div className="border border-line rounded-[var(--r-md)] bg-surface-alt/40 p-4 text-center text-sm text-muted">
            Nenhum item encontrado.
          </div>
        ) : (
          <div className="space-y-2 pr-3">
            {mode === 'food'
              ? filteredFoods.map((food) => <FoodDragItem key={food.id} food={food} />)
              : filteredPresets.map((preset) => <PresetDragItem key={preset.id} preset={preset} />)}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}

function FoodDragItem({ food }: { food: Food }) {
  const portionGrams = getFoodPortionGrams(food.portion);
  const macros = calculateFoodMacros(food, portionGrams);

  return (
    <div
      role="listitem"
      tabIndex={0}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData(PLAN_ITEM_DRAG_TYPE, encodePlanItemDragPayload({ type: 'food', id: food.id }));
        event.dataTransfer.setData('text/plain', food.name);
      }}
      className="group rounded-[var(--r-md)] border border-line bg-surface px-3 py-2.5 cursor-grab active:cursor-grabbing transition-[background,border-color,box-shadow] duration-120 hover:bg-surface-alt hover:shadow-1 focus:outline-none focus:border-ink"
      aria-label={`Alimento ${food.name}`}
    >
      <div className="flex items-start gap-2.5">
        <GripVertical size={15} className="mt-0.5 text-muted-2 group-hover:text-muted" />
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium leading-snug truncate">{food.name}</div>
          <div className="mono text-[11px] text-muted mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
            <span>{Math.round(macros.calories)} kcal</span>
            <span>P {Math.round(macros.protein)}g</span>
            <span>C {Math.round(macros.carbs)}g</span>
            <span>G {Math.round(macros.fat)}g</span>
          </div>
          <div className="mono text-[10.5px] text-muted-2 mt-1">{portionGrams}g</div>
        </div>
      </div>
    </div>
  );
}

function PresetDragItem({ preset }: { preset: PresetMeal }) {
  const macros = calculateFoodsMacros(preset.foods);

  return (
    <div
      role="listitem"
      tabIndex={0}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData(PLAN_ITEM_DRAG_TYPE, encodePlanItemDragPayload({ type: 'preset', id: preset.id }));
        event.dataTransfer.setData('text/plain', preset.name);
      }}
      className="group rounded-[var(--r-md)] border border-line bg-surface px-3 py-2.5 cursor-grab active:cursor-grabbing transition-[background,border-color,box-shadow] duration-120 hover:bg-surface-alt hover:shadow-1 focus:outline-none focus:border-ink"
      aria-label={`Refeição pronta ${preset.name}`}
    >
      <div className="flex items-start gap-2.5">
        <GripVertical size={15} className="mt-0.5 text-muted-2 group-hover:text-muted" />
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium leading-snug truncate">{preset.name}</div>
          <div className="mono text-[11px] text-muted mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
            <span>{preset.foods.length} itens</span>
            <span>{Math.round(macros.calories)} kcal</span>
            <span>P {Math.round(macros.protein)}g</span>
          </div>
          {preset.foods.length > 0 && (
            <div className="text-[11.5px] text-muted-2 mt-1 truncate">
              {preset.foods.map(({ food }) => food.name).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
