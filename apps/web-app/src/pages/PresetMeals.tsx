import { useState } from 'react';
import { Plus, BookCopy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePresetMeals } from '@/hooks/usePresetMeals';
import { useAllFoods } from '@/hooks/useFoods';
import { useMealPlans } from '@/hooks/useMealPlans';
import type { PresetMeal, Food } from '@/types';
import { PresetCard } from '@/components/preset-meals/PresetCard';
import { PresetNameDialog } from '@/components/preset-meals/PresetNameDialog';
import { DeletePresetDialog } from '@/components/preset-meals/DeletePresetDialog';
import { AddFoodToPresetDialog } from '@/components/preset-meals/AddFoodToPresetDialog';
import { ApplyPresetDialog } from '@/components/preset-meals/ApplyPresetDialog';

export default function PresetMeals() {
  const {
    presetMeals,
    addPresetMeal,
    updatePresetMeal,
    deletePresetMeal,
    addFoodToPreset,
    removeFoodFromPreset,
    applyPreset,
  } = usePresetMeals();
  const { foods } = useAllFoods();
  const { mealPlans } = useMealPlans();

  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PresetMeal | null>(null);
  const [presetName, setPresetName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [foodDialogPresetId, setFoodDialogPresetId] = useState<string | null>(null);
  const [applyPresetId, setApplyPresetId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingPreset(null);
    setPresetName('');
    setNameDialogOpen(true);
  };

  const handleOpenEdit = (preset: PresetMeal) => {
    setEditingPreset(preset);
    setPresetName(preset.name);
    setNameDialogOpen(true);
  };

  const handleSubmitName = async () => {
    if (!presetName.trim()) return;
    if (editingPreset) {
      await updatePresetMeal(editingPreset.id, presetName.trim());
    } else {
      await addPresetMeal(presetName.trim());
    }
    setNameDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await deletePresetMeal(deleteTarget);
      setDeleteTarget(null);
      if (expandedId === deleteTarget) setExpandedId(null);
    }
  };

  const handleAddFood = async (food: Food, quantity: number) => {
    if (!foodDialogPresetId) return;
    await addFoodToPreset(foodDialogPresetId, food, quantity);
  };

  const handleApply = async (_planId: string, mealIds: string[]) => {
    if (!applyPresetId) return;
    await applyPreset(applyPresetId, mealIds);
    setApplyPresetId(null);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Refeições Prontas</h1>
          <p className="mt-1 text-muted-foreground">Monte refeições reutilizáveis para aplicar nos seus planos</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-gradient-primary hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" />
          Nova Refeição Pronta
        </Button>
      </div>

      {presetMeals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <BookCopy className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground font-display">
              Nenhuma refeição pronta
            </h3>
            <p className="mt-2 text-center text-muted-foreground">
              Crie refeições prontas para reutilizar nos seus planos alimentares
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {presetMeals.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isExpanded={expandedId === preset.id}
              canApply={mealPlans.length > 0}
              onToggleExpand={() => setExpandedId(expandedId === preset.id ? null : preset.id)}
              onEdit={() => handleOpenEdit(preset)}
              onDelete={() => setDeleteTarget(preset.id)}
              onAddFood={() => setFoodDialogPresetId(preset.id)}
              onRemoveFood={(foodId) => removeFoodFromPreset(preset.id, foodId)}
              onApply={() => setApplyPresetId(preset.id)}
            />
          ))}
        </div>
      )}

      <PresetNameDialog
        open={nameDialogOpen}
        onOpenChange={setNameDialogOpen}
        name={presetName}
        onNameChange={setPresetName}
        isEditing={editingPreset !== null}
        onSubmit={handleSubmitName}
      />

      <DeletePresetDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleConfirmDelete}
      />

      <AddFoodToPresetDialog
        open={foodDialogPresetId !== null}
        onOpenChange={(open) => { if (!open) setFoodDialogPresetId(null); }}
        foods={foods}
        onAddFood={handleAddFood}
      />

      <ApplyPresetDialog
        open={applyPresetId !== null}
        onOpenChange={(open) => { if (!open) setApplyPresetId(null); }}
        mealPlans={mealPlans}
        onApply={handleApply}
      />
    </div>
  );
}
