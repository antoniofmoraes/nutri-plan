import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookCopy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { usePresetMeals } from '@/hooks/usePresetMeals';
import { useAllFoods } from '@/hooks/useFoods';
import { useMealPlans } from '@/hooks/useMealPlans';
import { getFoodPortionGrams } from '@/lib/macros';
import type { PresetMeal, Food } from '@/types';
import { PresetCard } from '@/components/preset-meals/PresetCard';
import { PresetNameDialog } from '@/components/preset-meals/PresetNameDialog';
import { AddFoodToPresetDialog } from '@/components/preset-meals/AddFoodToPresetDialog';
import { ApplyPresetDialog } from '@/components/preset-meals/ApplyPresetDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LibrarySidebar } from '@/components/shared/LibrarySidebar';
import type { LibraryItemDragPayload } from '@/components/shared/dragPayload';

export default function PresetMeals() {
  const {
    presetMeals,
    addPresetMeal,
    updatePresetMeal,
    duplicatePresetMeal,
    deletePresetMeal,
    addFoodToPreset,
    updateFoodInPreset,
    removeFoodFromPreset,
    copyFoodsBetweenPresets,
    applyPreset,
  } = usePresetMeals();
  const { foods } = useAllFoods();
  const { mealPlans, isLoading: isLoadingPlans } = useMealPlans();

  const navigate = useNavigate();
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [foodDialogPresetId, setFoodDialogPresetId] = useState<string | null>(null);
  const [applyPresetId, setApplyPresetId] = useState<string | null>(null);

  // Derivado da lista (e não guardado em estado) para refletir rename e sumir se o preset for excluído.
  const presetToApply = presetMeals.find((preset) => preset.id === applyPresetId) ?? null;

  const handleOpenCreate = () => {
    setPresetName('');
    setNameDialogOpen(true);
  };

  const handleSubmitName = async () => {
    if (!presetName.trim()) return;
    await addPresetMeal(presetName.trim());
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

  // Sem try/catch: o diálogo trata a falha para manter a seleção e continuar aberto (R8).
  const handleApply = async (_planId: string, mealIds: string[]) => {
    if (!applyPresetId) return;
    await applyPreset(applyPresetId, mealIds);
    setApplyPresetId(null);
  };

  const handleDropItem = async (target: PresetMeal, payload: LibraryItemDragPayload) => {
    try {
      if (payload.type === 'food') {
        const food = foods.find((item) => item.id === payload.id);
        if (!food) return;
        await addFoodToPreset(target.id, food, getFoodPortionGrams(food.portion));
      } else {
        if (payload.id === target.id) return;
        const source = presetMeals.find((preset) => preset.id === payload.id);
        if (!source) return;
        if (source.foods.length === 0) {
          toast.info('A refeição arrastada não tem alimentos para copiar');
          return;
        }
        // Uma chamada só: desfazer precisa reverter a cópia inteira, não o último alimento.
        await copyFoodsBetweenPresets(target.id, source.id);
      }
      setExpandedId(target.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao adicionar itens');
    }
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
        <EmptyState
          icon={BookCopy}
          title="Nenhuma refeição pronta"
          description="Crie refeições prontas para reutilizar nos seus planos alimentares."
          action={
            <Button variant="acc" onClick={handleOpenCreate}>
              <Plus size={16} />
              Criar primeira refeição
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="space-y-3 min-w-0">
            {presetMeals.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isExpanded={expandedId === preset.id}
                canApply={mealPlans.length > 0}
                allFoods={foods}
                onToggleExpand={() => setExpandedId(expandedId === preset.id ? null : preset.id)}
                onDuplicate={() => duplicatePresetMeal(preset.id)}
                onRename={(name) => updatePresetMeal(preset.id, name)}
                onDelete={() => setDeleteTarget(preset.id)}
                onAddFood={() => setFoodDialogPresetId(preset.id)}
                onRemoveFood={(foodId) => removeFoodFromPreset(preset.id, foodId)}
                onUpdateFood={(foodId, updates) => updateFoodInPreset(preset.id, foodId, updates)}
                onApply={() => setApplyPresetId(preset.id)}
                onDropItem={(payload) => handleDropItem(preset, payload)}
              />
            ))}
          </div>
          <LibrarySidebar
            foods={foods}
            presetMeals={presetMeals}
            dropHint="Arraste um item para uma refeição pronta para adicioná-lo."
          />
        </div>
      )}

      <PresetNameDialog
        open={nameDialogOpen}
        onOpenChange={setNameDialogOpen}
        name={presetName}
        onNameChange={setPresetName}
        onSubmit={handleSubmitName}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Excluir refeição pronta"
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
      />

      <AddFoodToPresetDialog
        open={foodDialogPresetId !== null}
        onOpenChange={(open) => { if (!open) setFoodDialogPresetId(null); }}
        foods={foods}
        onAddFood={handleAddFood}
      />

      <ApplyPresetDialog
        open={presetToApply !== null}
        onOpenChange={(open) => { if (!open) setApplyPresetId(null); }}
        preset={presetToApply}
        mealPlans={mealPlans}
        isLoadingPlans={isLoadingPlans}
        onApply={handleApply}
        onCreatePlan={() => navigate('/planos')}
      />
    </div>
  );
}
