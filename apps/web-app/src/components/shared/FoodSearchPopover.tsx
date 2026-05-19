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
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          {selectedFood ? (
            <span className="truncate">{selectedFood.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
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
          {filteredFoods.length === 0 ? (
            <p className="p-3 text-sm text-center text-muted-foreground">
              Nenhum alimento encontrado
            </p>
          ) : (
            filteredFoods.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => onSelect(food.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary ${
                  selectedFoodId === food.id ? 'bg-secondary' : ''
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
  );
}
