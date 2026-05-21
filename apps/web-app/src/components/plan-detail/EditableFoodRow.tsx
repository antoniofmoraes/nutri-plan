import { useState, useMemo } from 'react';
import { Edit, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Food } from '@/types';

interface EditableFoodRowProps {
  foods: Food[];
  currentFood: Food;
  currentQuantity: number;
  onSave: (updates: { newFoodId?: string; quantity?: number }) => void;
  onRemove: () => void;
}

export function EditableFoodRow({ foods, currentFood, currentQuantity, onSave, onRemove }: EditableFoodRowProps) {
  const [editing, setEditing] = useState(false);
  const [foodId, setFoodId] = useState(currentFood.id);
  const [quantity, setQuantity] = useState(currentQuantity.toString());
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? foods.filter(f => f.name.toLowerCase().includes(q)) : foods;
    return list.slice(0, 100);
  }, [foods, search]);

  const selectedFood = foods.find(f => f.id === foodId) ?? currentFood;

  const kcal = Math.round(selectedFood.calories * currentQuantity / 100);

  const startEdit = () => {
    setFoodId(currentFood.id);
    setQuantity(currentQuantity.toString());
    setSearch('');
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = () => {
    const updates: { newFoodId?: string; quantity?: number } = {};
    if (foodId !== currentFood.id) updates.newFoodId = foodId;
    const qNum = Number(quantity);
    if (qNum > 0 && qNum !== currentQuantity) updates.quantity = qNum;
    if (Object.keys(updates).length > 0) onSave(updates);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line last:border-b-0 group">
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <span className="text-[13.5px] font-medium truncate">{currentFood.name}</span>
          <span className="mono text-[11px] text-muted flex-shrink-0">{currentQuantity}g</span>
          <span className="num text-[11px] font-medium flex-shrink-0" style={{ color: 'var(--m-cal)' }}>
            {kcal} kcal
          </span>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms]">
          <button
            className="w-[26px] h-[26px] rounded-sm grid place-items-center text-muted hover:bg-surface-alt hover:text-ink transition-[background,color] duration-[120ms]"
            onClick={startEdit}
            title="Editar"
          >
            <Edit size={13} strokeWidth={1.6} />
          </button>
          <button
            className="w-[26px] h-[26px] rounded-sm grid place-items-center text-muted hover:bg-surface-alt hover:text-danger transition-[background,color] duration-[120ms]"
            onClick={onRemove}
            title="Remover"
          >
            <X size={13} strokeWidth={1.6} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b border-line last:border-b-0 bg-surface-alt/50 space-y-2.5">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="sec" size="sm" className="w-full justify-start text-left font-normal">
            <span className="truncate text-[12.5px]">{selectedFood.name}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="p-2 border-b border-line">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <Input
                placeholder="Buscar alimento…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-[12.5px]"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-3 text-[12.5px] text-center text-muted">Nenhum alimento</p>
            ) : (
              filtered.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => setFoodId(food.id)}
                  className={`w-full text-left px-3 py-2 text-[12.5px] hover:bg-surface-alt transition-[background] duration-[120ms] border-b border-line last:border-b-0 ${
                    foodId === food.id ? 'bg-surface-alt' : ''
                  }`}
                >
                  <div className="font-medium truncate">{food.name}</div>
                  <div className="mono text-[10.5px] text-muted mt-0.5">{food.calories} kcal/100g</div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="h-8 flex-1 text-[12.5px]"
          placeholder="Gramas"
        />
        <span className="mono text-[11px] text-muted">g</span>
        <Button variant="ghost" size="xs" onClick={cancel}>
          Cancelar
        </Button>
        <Button variant="acc" size="xs" onClick={save}>
          Salvar
        </Button>
      </div>
    </div>
  );
}
