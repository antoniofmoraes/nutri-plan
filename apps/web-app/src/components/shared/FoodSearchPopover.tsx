import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Food } from '@/types';

interface FoodSearchPopoverProps {
  foods: Food[];
  selectedFoodId: string;
  onSelect: (foodId: string) => void;
  placeholder?: string;
}

export function FoodSearchPopover({
  foods,
  selectedFoodId,
  onSelect,
  placeholder = 'Selecione um alimento',
}: FoodSearchPopoverProps) {
  const [search, setSearch] = useState('');

  const filteredFoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? foods.filter(f => f.name.toLowerCase().includes(q)) : foods;
    return list.slice(0, 100);
  }, [foods, search]);

  const selectedFood = foods.find(f => f.id === selectedFoodId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="sec" className="w-full justify-start text-left font-normal">
          {selectedFood ? (
            <span className="truncate text-[13.5px]">{selectedFood.name}</span>
          ) : (
            <span className="text-muted text-[13.5px]">{placeholder}</span>
          )}
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
          {filteredFoods.length === 0 ? (
            <p className="p-3 text-[12.5px] text-center text-muted">
              Nenhum alimento encontrado
            </p>
          ) : (
            filteredFoods.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => onSelect(food.id)}
                className={`w-full text-left px-3 py-2 text-[12.5px] hover:bg-surface-alt border-b border-line last:border-b-0 transition-[background] duration-120 ${
                  selectedFoodId === food.id ? 'bg-surface-alt' : ''
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
  );
}
