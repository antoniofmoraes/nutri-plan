import { useState } from 'react';
import { Plus, BookCopy } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-2">Templates</div>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] leading-[1.1]">
            Refeições prontas
          </h1>
          <p className="text-muted mt-2 max-w-[56ch] text-sm">
            Monte refeições reutilizáveis para aplicar nos seus planos.
          </p>
        </div>
        <Button variant="acc" onClick={handleOpenCreate}>
          <Plus size={16} />
          Nova refeição pronta
        </Button>
      </div>

      {/* Content */}
      {presetMeals.length === 0 ? (
        <div className="bg-surface border border-line rounded-lg shadow-1 p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-lg bg-accent-soft text-accent grid place-items-center mb-4">
            <BookCopy size={26} strokeWidth={1.6} />
          </div>
          <h3 className="text-[19px] font-semibold mb-1.5">
            Nenhuma refeição pronta
          </h3>
          <p className="text-muted max-w-[360px] mb-5">
            Crie refeições prontas para reutilizar nos seus planos alimentares.
          </p>
          <Button variant="acc" onClick={handleOpenCreate}>
            <Plus size={16} />
            Criar primeira refeição
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
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
