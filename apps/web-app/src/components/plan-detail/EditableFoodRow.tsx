import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { calculateFoodMacros } from '@/lib/macros';
import type { Food } from '@/types';

interface EditableFoodRowProps {
  foods: Food[];
  currentFood: Food;
  currentQuantity: number;
  readOnly?: boolean;
  onSave: (updates: { newFoodId?: string; quantity?: number }) => void;
  onRemove: () => void;
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? allFoods.filter(f => f.name.toLowerCase().includes(q)) : allFoods;
    return list.slice(0, 80);
  }, [allFoods, search]);

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

export function EditableFoodRow({ foods, currentFood, currentQuantity, readOnly, onSave, onRemove }: EditableFoodRowProps) {
  const macros = calculateFoodMacros(currentFood, currentQuantity);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-line last:border-b-0 group">
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        {readOnly ? (
          <span className="text-[13.5px] font-medium truncate">{currentFood.name}</span>
        ) : (
          <InlineFoodSwap
            currentFood={currentFood}
            allFoods={foods}
            onSwap={(newFoodId) => onSave({ newFoodId })}
          />
        )}
        {readOnly ? (
          <span className="mono text-[12.5px] font-medium text-muted flex-shrink-0">{currentQuantity}g</span>
        ) : (
          <InlineQuantityEdit
            quantity={currentQuantity}
            onSave={(quantity) => onSave({ quantity })}
          />
        )}
        <div className="mono inline-flex gap-2 text-[12px] font-medium">
          <span className="num" style={{ color: 'var(--m-cal)' }}>
            {macros.calories.toFixed(0)} kcal
          </span>
          <span style={{ color: 'var(--m-prot)' }}>
            P {macros.protein.toFixed(0)}g
          </span>
          <span style={{ color: 'var(--m-carb)' }}>
            C {macros.carbs.toFixed(0)}g
          </span>
          <span style={{ color: 'var(--m-fat)' }}>
            G {macros.fat.toFixed(0)}g
          </span>
        </div>
      </div>
      {!readOnly && (
        <button
          className="w-[26px] h-[26px] rounded-sm grid place-items-center text-muted hover:bg-surface-alt hover:text-danger opacity-0 group-hover:opacity-100 transition-[background,color,opacity] duration-120"
          onClick={onRemove}
          title="Remover"
        >
          <X size={13} strokeWidth={1.6} />
        </button>
      )}
    </div>
  );
}
