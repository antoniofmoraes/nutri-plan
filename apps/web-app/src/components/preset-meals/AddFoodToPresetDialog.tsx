import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FoodSearchPopover } from '@/components/shared/FoodSearchPopover';
import { getFoodPortionGrams } from '@/lib/macros';
import { parseDecimalInput } from '@/lib/utils';
import type { Food } from '@/types';

interface AddFoodToPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foods: Food[];
  onAddFood: (food: Food, quantity: number) => void;
}

export function AddFoodToPresetDialog({
  open,
  onOpenChange,
  foods,
  onAddFood,
}: AddFoodToPresetDialogProps) {
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [foodQuantity, setFoodQuantity] = useState('100');
  const parsedFoodQuantity = parseDecimalInput(foodQuantity);
  const hasValidFoodQuantity = parsedFoodQuantity !== null && parsedFoodQuantity > 0;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedFoodId('');
      setFoodQuantity('100');
    }
    onOpenChange(next);
  };

  const handleAdd = () => {
    const food = foods.find(f => f.id === selectedFoodId);
    if (!food || !hasValidFoodQuantity) return;
    onAddFood(food, parsedFoodQuantity);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar alimento</DialogTitle>
          <DialogDescription>
            Selecione um alimento e a quantidade.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div>
            <label className="label-mono">Alimento</label>
            <FoodSearchPopover
              foods={foods}
              selectedFoodId={selectedFoodId}
              onSelect={(foodId) => {
                setSelectedFoodId(foodId);
                const food = foods.find(item => item.id === foodId);
                if (food) setFoodQuantity(String(getFoodPortionGrams(food.portion)));
              }}
            />
          </div>
          <div>
            <label className="label-mono">Quantidade (gramas)</label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="100"
              value={foodQuantity}
              onChange={(e) => setFoodQuantity(e.target.value)}
              aria-invalid={foodQuantity.length > 0 && !hasValidFoodQuantity}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </DialogClose>
          <Button variant="acc" onClick={handleAdd} disabled={!selectedFoodId || !hasValidFoodQuantity}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
