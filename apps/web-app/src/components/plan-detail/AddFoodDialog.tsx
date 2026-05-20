import { useState } from 'react';
import { BookCopy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FoodSearchPopover } from '@/components/shared/FoodSearchPopover';
import type { Food, PresetMeal } from '@/types';

interface AddFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foods: Food[];
  presetMeals: PresetMeal[];
  onAddFood: (food: Food, quantity: number) => void;
  onApplyPreset: (presetId: string) => void;
}

export function AddFoodDialog({
  open,
  onOpenChange,
  foods,
  presetMeals,
  onAddFood,
  onApplyPreset,
}: AddFoodDialogProps) {
  const [mode, setMode] = useState<'food' | 'preset'>('food');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [foodQuantity, setFoodQuantity] = useState('100');
  const [selectedPresetId, setSelectedPresetId] = useState('');

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setMode('food');
      setSelectedFoodId('');
      setFoodQuantity('100');
      setSelectedPresetId('');
    }
    onOpenChange(next);
  };

  const handleAddFood = () => {
    const food = foods.find(f => f.id === selectedFoodId);
    if (!food) return;
    onAddFood(food, Number(foodQuantity));
    handleOpenChange(false);
  };

  const handleApplyPreset = () => {
    if (!selectedPresetId) return;
    onApplyPreset(selectedPresetId);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === 'food' ? 'Adicionar Alimento' : 'Aplicar Refeição Pronta'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'food' | 'preset')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="food" className="text-xs">Alimento</TabsTrigger>
            <TabsTrigger value="preset" className="text-xs" disabled={presetMeals.length === 0}>
              <BookCopy className="mr-1 h-3 w-3" />
              Refeição Pronta
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === 'food' ? (
          <>
            <div className="space-y-4 py-2">
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
              <Button onClick={handleAddFood} className="bg-gradient-primary" disabled={!selectedFoodId}>
                Adicionar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Refeição Pronta</Label>
                <div className="max-h-64 overflow-y-auto rounded-md border">
                  {presetMeals.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary border-b last:border-b-0 ${
                        selectedPresetId === preset.id ? 'bg-secondary' : ''
                      }`}
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {preset.foods.length} alimento{preset.foods.length !== 1 ? 's' : ''}
                        {preset.foods.length > 0 && (
                          <span className="ml-1">
                            — {preset.foods.map(f => f.food.name).join(', ')}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Os alimentos atuais da refeição serão substituídos pelos alimentos da refeição pronta.
              </p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleApplyPreset} className="bg-gradient-primary" disabled={!selectedPresetId}>
                Aplicar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
