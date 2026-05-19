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
      <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm group">
        <div className="flex-1 min-w-0">
          <span className="font-medium">{currentFood.name}</span>
          <span className="ml-2 text-muted-foreground">{currentQuantity}g</span>
        </div>
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-60 group-hover:opacity-100"
            onClick={startEdit}
            title="Editar"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:text-destructive opacity-60 group-hover:opacity-100"
            onClick={onRemove}
            title="Remover"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-secondary p-2 space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal h-8">
            <span className="truncate text-xs">{selectedFood.name}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar alimento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-center text-muted-foreground">Nenhum alimento</p>
            ) : (
              filtered.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => setFoodId(food.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary ${
                    foodId === food.id ? 'bg-secondary' : ''
                  }`}
                >
                  <div className="font-medium truncate">{food.name}</div>
                  <div className="text-xs text-muted-foreground">{food.calories} kcal/100g</div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="h-8 flex-1"
          placeholder="Gramas"
        />
        <span className="text-xs text-muted-foreground">g</span>
        <Button variant="outline" size="sm" className="h-8" onClick={cancel}>
          Cancelar
        </Button>
        <Button size="sm" className="h-8 bg-gradient-primary" onClick={save}>
          Salvar
        </Button>
      </div>
    </div>
  );
}
