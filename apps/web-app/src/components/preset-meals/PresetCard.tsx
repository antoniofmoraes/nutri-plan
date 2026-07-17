import { useState, useRef, useEffect, type DragEvent } from 'react';
import { Plus, Edit, Trash2, X, ChevronDown, ChevronUp, Send, Search, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { calculateFoodMacros, calculateFoodsMacros } from '@/lib/macros';
import {
  hasLibraryItemDragPayload,
  parseLibraryItemDragPayload,
  LIBRARY_ITEM_DRAG_TYPE,
  type LibraryItemDragPayload,
} from '@/components/shared/dragPayload';
import { cn } from '@/lib/utils';
import type { PresetMeal, Food } from '@/types';

interface PresetCardProps {
  preset: PresetMeal;
  isExpanded: boolean;
  canApply: boolean;
  allFoods: Food[];
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddFood: () => void;
  onRemoveFood: (foodId: string) => void;
  onUpdateFood: (foodId: string, updates: { newFoodId?: string; quantity?: number }) => void;
  onDuplicate: () => void;
  onApply: () => void;
  onDropItem?: (payload: LibraryItemDragPayload) => void;
}

function InlineQuantityEdit({ quantity, onSave }: { quantity: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(quantity));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setValue(String(quantity));
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, quantity]);

  const commit = () => {
    setEditing(false);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0 && parsed !== quantity) {
      onSave(parsed);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        className="mono text-[12.5px] font-medium text-muted hover:text-foreground hover:bg-surface-alt px-1 py-0.5 rounded transition-colors duration-100 cursor-text"
        onClick={() => setEditing(true)}
      >
        {quantity}g
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setEditing(false);
      }}
      className="mono text-[12.5px] font-medium w-14 bg-surface-alt border border-line rounded px-1 py-0.5 text-center outline-none focus:ring-1 focus:ring-accent"
    />
  );
}

function InlineFoodSwap({
  currentFood,
  allFoods,
  onSwap,
}: {
  currentFood: Food;
  allFoods: Food[];
  onSwap: (newFoodId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? allFoods.filter(f => f.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 80)
    : allFoods.slice(0, 80);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-[13.5px] font-medium truncate text-left hover:text-accent transition-colors duration-100 cursor-text"
        >
          {currentFood.name}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" side="bottom">
        <div className="p-2 border-b border-line">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Buscar alimento…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-[12.5px]"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-3 text-[12.5px] text-center text-muted">
              Nenhum alimento encontrado
            </p>
          ) : (
            filtered.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => {
                  if (food.id !== currentFood.id) onSwap(food.id);
                  setOpen(false);
                  setSearch('');
                }}
                className={`w-full text-left px-3 py-2 text-[12.5px] hover:bg-surface-alt border-b border-line last:border-b-0 transition-[background] duration-120 ${
                  currentFood.id === food.id ? 'bg-surface-alt' : ''
                }`}
              >
                <div className="font-medium truncate">{food.name}</div>
                <div className="mono text-[10.5px] text-muted mt-0.5">
                  {food.calories} kcal/{food.portion || '100g'}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PresetCard({
  preset,
  isExpanded,
  canApply,
  allFoods,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddFood,
  onRemoveFood,
  onUpdateFood,
  onDuplicate,
  onApply,
  onDropItem,
}: PresetCardProps) {
  const macros = calculateFoodsMacros(preset.foods);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!onDropItem || !hasLibraryItemDragPayload(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    setIsDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
    if (!onDropItem) return;
    event.preventDefault();
    const payload = parseLibraryItemDragPayload(event.dataTransfer.getData(LIBRARY_ITEM_DRAG_TYPE));
    if (payload) onDropItem(payload);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'bg-surface border border-line rounded-lg shadow-1 overflow-hidden transition-[background,border-color,box-shadow] duration-120',
        isDragOver && 'border-ink bg-surface-alt shadow-2'
      )}
    >
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
              {isDragOver && <Badge variant="solid">Soltar</Badge>}
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
            <Button variant="ghost" size="icon-sm" onClick={onDuplicate} title="Duplicar">
              <Copy size={14} strokeWidth={1.6} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onEdit} title="Renomear">
              <Edit size={14} strokeWidth={1.6} />
            </Button>
            <Button variant="ghost" size="icon-sm" className="hover:text-danger" onClick={onDelete} title="Excluir">
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
            preset.foods.map(({ food, quantity }) => {
              const foodMacros = calculateFoodMacros(food, quantity);
              return (
                <div key={food.id} className="flex items-center justify-between px-4 py-2.5 border-b border-line last:border-b-0 group">
                  <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                    <InlineFoodSwap
                      currentFood={food}
                      allFoods={allFoods}
                      onSwap={(newFoodId) => onUpdateFood(food.id, { newFoodId })}
                    />
                    <InlineQuantityEdit
                      quantity={quantity}
                      onSave={(newQty) => onUpdateFood(food.id, { quantity: newQty })}
                    />
                    <div className="mono inline-flex gap-2 text-[12px] font-medium">
                      <span className="num" style={{ color: 'var(--m-cal)' }}>{foodMacros.calories.toFixed(0)} kcal</span>
                      <span style={{ color: 'var(--m-pro)' }}>P {foodMacros.protein.toFixed(0)}g</span>
                      <span style={{ color: 'var(--m-carb)' }}>C {foodMacros.carbs.toFixed(0)}g</span>
                      <span style={{ color: 'var(--m-fat)' }}>G {foodMacros.fat.toFixed(0)}g</span>
                    </div>
                  </div>
                  <button
                    className="w-[26px] h-[26px] rounded-sm grid place-items-center text-muted hover:bg-surface-alt hover:text-danger opacity-0 group-hover:opacity-100 transition-[background,color,opacity] duration-120"
                    onClick={() => onRemoveFood(food.id)}
                  >
                    <X size={13} strokeWidth={1.6} />
                  </button>
                </div>
              );
            })
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
