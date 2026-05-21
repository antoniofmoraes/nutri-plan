import { Plus, Edit, Trash2, X, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateFoodsMacros } from '@/lib/macros';
import type { PresetMeal } from '@/types';

interface PresetCardProps {
  preset: PresetMeal;
  isExpanded: boolean;
  canApply: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddFood: () => void;
  onRemoveFood: (foodId: string) => void;
  onApply: () => void;
}

export function PresetCard({
  preset,
  isExpanded,
  canApply,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddFood,
  onRemoveFood,
  onApply,
}: PresetCardProps) {
  const macros = calculateFoodsMacros(preset.foods);

  return (
    <div className="bg-surface border border-line rounded-lg shadow-1 overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={onToggleExpand}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[15px] truncate">{preset.name}</span>
              {isExpanded
                ? <ChevronUp size={15} className="text-muted flex-shrink-0" />
                : <ChevronDown size={15} className="text-muted flex-shrink-0" />}
            </div>
            <div className="mono inline-flex gap-2 mt-1 text-[11.5px] text-muted flex-wrap">
              <span className="num font-medium" style={{ color: 'var(--m-cal)' }}>{macros.calories.toFixed(0)} kcal</span>
              <span>P {macros.protein.toFixed(0)}g</span>
              <span>C {macros.carbs.toFixed(0)}g</span>
              <span>G {macros.fat.toFixed(0)}g</span>
              <span>· {preset.foods.length} alimento{preset.foods.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="sec"
              size="sm"
              onClick={onApply}
              disabled={preset.foods.length === 0 || !canApply}
              title="Aplicar no plano"
            >
              <Send size={13} />
              Aplicar
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onEdit}>
              <Edit size={14} strokeWidth={1.6} />
            </Button>
            <Button variant="ghost" size="icon-sm" className="hover:text-danger" onClick={onDelete}>
              <Trash2 size={14} strokeWidth={1.6} />
            </Button>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-line">
          {preset.foods.length === 0 ? (
            <div className="p-4 text-[13px] text-muted italic">Nenhum alimento adicionado</div>
          ) : (
            preset.foods.map(({ food, quantity }) => (
              <div key={food.id} className="flex items-center justify-between px-4 py-2.5 border-b border-line last:border-b-0 group">
                <div className="flex-1 min-w-0 flex items-baseline gap-2">
                  <span className="text-[13.5px] font-medium truncate">{food.name}</span>
                  <span className="mono text-[11px] text-muted">{quantity}g</span>
                  <span className="num text-[11px] font-medium" style={{ color: 'var(--m-cal)' }}>
                    {(food.calories * quantity / 100).toFixed(0)} kcal
                  </span>
                </div>
                <button
                  className="w-[26px] h-[26px] rounded-sm grid place-items-center text-muted hover:bg-surface-alt hover:text-danger opacity-0 group-hover:opacity-100 transition-[background,color,opacity] duration-[120ms]"
                  onClick={() => onRemoveFood(food.id)}
                >
                  <X size={13} strokeWidth={1.6} />
                </button>
              </div>
            ))
          )}
          <div className="p-3">
            <Button
              variant="sec"
              size="sm"
              className="w-full border-dashed"
              onClick={onAddFood}
            >
              <Plus size={14} />
              Adicionar alimento
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
