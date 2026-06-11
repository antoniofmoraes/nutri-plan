import { useState } from 'react';
import { BookCopy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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
  const [search, setSearch] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [foodQuantity, setFoodQuantity] = useState('100');
  const [selectedPresetId, setSelectedPresetId] = useState('');

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setMode('food');
      setSearch('');
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

  const filtered = foods.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20);

  const selectedFood = foods.find(f => f.id === selectedFoodId);
  const estimatedKcal = selectedFood ? Math.round(selectedFood.calories * Number(foodQuantity) / 100) : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent lg>
        <DialogHeader>
          <DialogTitle>Adicionar à refeição</DialogTitle>
          <DialogDescription>
            Escolha um alimento individual ou aplique uma refeição pronta.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {/* Tabs */}
          <div className="inline-flex bg-surface-alt border border-line rounded-[var(--r-md)] p-[3px] gap-0.5 w-full">
            <button
              onClick={() => setMode('food')}
              className={cn(
                'flex-1 px-3.5 py-1.5 rounded-[7px] text-[13px] font-medium transition-[background,color,box-shadow] duration-120',
                mode === 'food'
                  ? 'bg-surface text-ink shadow-1'
                  : 'text-muted hover:text-ink'
              )}
            >
              Alimento
            </button>
            <button
              onClick={() => presetMeals.length > 0 && setMode('preset')}
              disabled={presetMeals.length === 0}
              className={cn(
                'flex-1 px-3.5 py-1.5 rounded-[7px] text-[13px] font-medium transition-[background,color,box-shadow] duration-120 flex items-center justify-center gap-1.5',
                mode === 'preset'
                  ? 'bg-surface text-ink shadow-1'
                  : 'text-muted hover:text-ink',
                presetMeals.length === 0 && 'opacity-40 cursor-not-allowed'
              )}
            >
              <BookCopy size={13} />
              Refeição pronta
            </button>
          </div>

          {mode === 'food' ? (
            <>
              <Input
                placeholder="Buscar alimentos…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="max-h-[240px] overflow-y-auto border border-line rounded-[var(--r-md)]">
                {filtered.length === 0 ? (
                  <div className="p-4 text-center text-[13px] text-muted">
                    Nenhum alimento encontrado.
                  </div>
                ) : (
                  filtered.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFoodId(f.id)}
                      className={cn(
                        'w-full text-left px-3.5 py-2.5 flex items-center justify-between border-b border-line last:border-b-0 transition-[background] duration-120 cursor-pointer',
                        selectedFoodId === f.id ? 'bg-surface-alt' : 'hover:bg-surface-alt/50'
                      )}
                    >
                      <div>
                        <div className="text-[13.5px] font-medium">{f.name}</div>
                        <div className="mono text-[11px] text-muted mt-0.5">
                          {f.portion} · {f.calories} kcal · P {f.protein}g · C {f.carbs}g · G {f.fat}g
                        </div>
                      </div>
                      {selectedFoodId === f.id && <Check size={16} className="text-accent flex-shrink-0" />}
                    </button>
                  ))
                )}
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2.5 items-end">
                <div>
                  <label className="label-mono">Quantidade (g)</label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="100"
                    value={foodQuantity}
                    onChange={(e) => setFoodQuantity(e.target.value)}
                  />
                </div>
                <div className="mono text-[11px] text-muted pb-3">
                  {selectedFood ? `≈ ${estimatedKcal} kcal` : 'Selecione um alimento'}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="max-h-[300px] overflow-y-auto border border-line rounded-[var(--r-md)]">
                {presetMeals.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={cn(
                      'w-full text-left px-3.5 py-2.5 border-b border-line last:border-b-0 transition-[background] duration-120 cursor-pointer',
                      selectedPresetId === preset.id ? 'bg-surface-alt' : 'hover:bg-surface-alt/50'
                    )}
                  >
                    <div className="font-medium text-[13.5px]">{preset.name}</div>
                    <div className="mono text-[11px] text-muted mt-0.5">
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
              <p className="text-[12px] text-muted">
                Os alimentos atuais da refeição serão substituídos pelos da refeição pronta.
              </p>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </DialogClose>
          {mode === 'food' ? (
            <Button variant="acc" onClick={handleAddFood} disabled={!selectedFoodId}>
              Adicionar
            </Button>
          ) : (
            <Button variant="acc" onClick={handleApplyPreset} disabled={!selectedPresetId}>
              Aplicar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
