import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FoodSearchPopover } from '@/components/shared/FoodSearchPopover';
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

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedFoodId('');
      setFoodQuantity('100');
    }
    onOpenChange(next);
  };

  const handleAdd = () => {
    const food = foods.find(f => f.id === selectedFoodId);
    if (!food) return;
    onAddFood(food, Number(foodQuantity));
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Adicionar Alimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Alimento</Label>
            <FoodSearchPopover
              foods={foods}
              selectedFoodId={selectedFoodId}
              onSelect={setSelectedFoodId}
            />
          </div>
          <div className="space-y-2">
            <Label>Quantidade (gramas)</Label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="100"
              value={foodQuantity}
              onChange={(e) => setFoodQuantity(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleAdd} className="bg-gradient-primary" disabled={!selectedFoodId}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
