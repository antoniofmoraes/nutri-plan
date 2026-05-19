import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, BookCopy, X, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useMealPlan } from '@/contexts/MealPlanContext';
import { PresetMeal, Food, MealPlan, WeekDay } from '@/types';

const weekDays: { value: WeekDay; label: string; short: string }[] = [
  { value: 'segunda', label: 'Segunda', short: 'Seg' },
  { value: 'terca', label: 'Terça', short: 'Ter' },
  { value: 'quarta', label: 'Quarta', short: 'Qua' },
  { value: 'quinta', label: 'Quinta', short: 'Qui' },
  { value: 'sexta', label: 'Sexta', short: 'Sex' },
  { value: 'sabado', label: 'Sábado', short: 'Sáb' },
  { value: 'domingo', label: 'Domingo', short: 'Dom' },
];

export default function PresetMeals() {
  const {
    presetMeals,
    foods,
    mealPlans,
    addPresetMeal,
    updatePresetMeal,
    deletePresetMeal,
    addFoodToPreset,
    removeFoodFromPreset,
    applyPreset,
  } = useMealPlan();

  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PresetMeal | null>(null);
  const [presetName, setPresetName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Food dialog
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [targetPresetId, setTargetPresetId] = useState<string | null>(null);
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [foodQuantity, setFoodQuantity] = useState('100');
  const [foodSearch, setFoodSearch] = useState('');

  // Apply dialog
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyPresetId, setApplyPresetId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedMealIds, setSelectedMealIds] = useState<Set<string>>(new Set());

  const filteredFoods = useMemo(() => {
    const q = foodSearch.trim().toLowerCase();
    const list = q ? foods.filter(f => f.name.toLowerCase().includes(q)) : foods;
    return list.slice(0, 100);
  }, [foods, foodSearch]);

  const selectedFood = foods.find(f => f.id === selectedFoodId);

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

  const handleOpenAddFood = (presetId: string) => {
    setTargetPresetId(presetId);
    setSelectedFoodId('');
    setFoodQuantity('100');
    setFoodSearch('');
    setFoodDialogOpen(true);
  };

  const handleAddFood = async () => {
    if (!targetPresetId || !selectedFoodId) return;
    const food = foods.find(f => f.id === selectedFoodId);
    if (!food) return;
    await addFoodToPreset(targetPresetId, food, Number(foodQuantity));
    setFoodDialogOpen(false);
  };

  const handleRemoveFood = async (presetId: string, foodId: string) => {
    await removeFoodFromPreset(presetId, foodId);
  };

  const handleOpenApply = (presetId: string) => {
    setApplyPresetId(presetId);
    setSelectedPlanId(mealPlans.length > 0 ? mealPlans[0].id : '');
    setSelectedMealIds(new Set());
    setApplyDialogOpen(true);
  };

  const handleApply = async () => {
    if (!applyPresetId || !selectedPlanId || selectedMealIds.size === 0) return;
    await applyPreset(selectedPlanId, applyPresetId, Array.from(selectedMealIds));
    setApplyDialogOpen(false);
  };

  const selectedPlan = mealPlans.find(p => p.id === selectedPlanId);

  const toggleMealId = (id: string) => {
    setSelectedMealIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const calculatePresetMacros = (preset: PresetMeal) => {
    return preset.foods.reduce(
      (acc, { food, quantity }) => ({
        calories: acc.calories + (food.calories * quantity) / 100,
        protein: acc.protein + (food.protein * quantity) / 100,
        carbs: acc.carbs + (food.carbs * quantity) / 100,
        fat: acc.fat + (food.fat * quantity) / 100,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
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
          {presetMeals.map((preset) => {
            const macros = calculatePresetMacros(preset);
            const isExpanded = expandedId === preset.id;
            return (
              <Card key={preset.id}>
                <div className="p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : preset.id)}
                    >
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-display truncate">{preset.name}</CardTitle>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        <span className="text-accent font-medium">{macros.calories.toFixed(0)} kcal</span>
                        <span>P: {macros.protein.toFixed(0)}g</span>
                        <span>C: {macros.carbs.toFixed(0)}g</span>
                        <span>G: {macros.fat.toFixed(0)}g</span>
                        <span>• {preset.foods.length} alimento{preset.foods.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 sm:h-9"
                        onClick={() => handleOpenApply(preset.id)}
                        disabled={preset.foods.length === 0 || mealPlans.length === 0}
                        title="Aplicar no plano"
                      >
                        <Send className="mr-1 h-3 w-3" />
                        Aplicar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 sm:h-9 sm:w-9"
                        onClick={() => handleOpenEdit(preset)}
                        aria-label="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 sm:h-9 sm:w-9 hover:text-destructive"
                        onClick={() => setDeleteTarget(preset.id)}
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <CardContent>
                    <div className="space-y-2">
                      {preset.foods.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Nenhum alimento adicionado</p>
                      ) : (
                        preset.foods.map(({ food, quantity }) => (
                          <div key={food.id} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm group">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{food.name}</span>
                              <span className="ml-2 text-muted-foreground">{quantity}g</span>
                              <span className="ml-2 text-xs text-accent">
                                {(food.calories * quantity / 100).toFixed(0)} kcal
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:text-destructive opacity-60 group-hover:opacity-100"
                              onClick={() => handleRemoveFood(preset.id, food.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed"
                        onClick={() => handleOpenAddFood(preset.id)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Adicionar alimento
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Name Dialog (create/edit) */}
      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingPreset ? 'Renomear Refeição Pronta' : 'Nova Refeição Pronta'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Almoço Frango com Arroz"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitName(); }}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSubmitName} className="bg-gradient-primary" disabled={!presetName.trim()}>
              {editingPreset ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Excluir refeição pronta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir esta refeição pronta? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Food Dialog */}
      <Dialog open={foodDialogOpen} onOpenChange={setFoodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Adicionar Alimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Alimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {selectedFood ? (
                      <span className="truncate">{selectedFood.name}</span>
                    ) : (
                      <span className="text-muted-foreground">Selecione um alimento</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar alimento..."
                        value={foodSearch}
                        onChange={(e) => setFoodSearch(e.target.value)}
                        className="pl-8 h-8"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredFoods.length === 0 ? (
                      <p className="p-3 text-sm text-center text-muted-foreground">Nenhum alimento encontrado</p>
                    ) : (
                      filteredFoods.map((food) => (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => setSelectedFoodId(food.id)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary ${selectedFoodId === food.id ? 'bg-secondary' : ''}`}
                        >
                          <div className="font-medium truncate">{food.name}</div>
                          <div className="text-xs text-muted-foreground">{food.calories} kcal/100g</div>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Quantidade (gramas)</Label>
              <Input
                type="number"
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
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <ApplyPresetDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        mealPlans={mealPlans}
        selectedPlanId={selectedPlanId}
        onSelectPlan={(id) => { setSelectedPlanId(id); setSelectedMealIds(new Set()); }}
        selectedPlan={selectedPlan}
        selectedMealIds={selectedMealIds}
        onToggleMealId={toggleMealId}
        onApply={handleApply}
      />
    </div>
  );
}

// ─── Apply Preset Dialog ─────────────────────────────────

interface ApplyPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealPlans: MealPlan[];
  selectedPlanId: string;
  onSelectPlan: (id: string) => void;
  selectedPlan?: MealPlan;
  selectedMealIds: Set<string>;
  onToggleMealId: (id: string) => void;
  onApply: () => void;
}

function ApplyPresetDialog({
  open, onOpenChange, mealPlans, selectedPlanId, onSelectPlan,
  selectedPlan, selectedMealIds, onToggleMealId, onApply,
}: ApplyPresetDialogProps) {
  const orderedSlots = selectedPlan
    ? [...selectedPlan.slots].sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Aplicar Refeição Pronta</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Selecione em quais refeições da semana deseja aplicar. Os alimentos existentes serão substituídos.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Plan selector */}
          <div className="space-y-2">
            <Label>Plano alimentar</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={selectedPlanId}
              onChange={(e) => onSelectPlan(e.target.value)}
            >
              {mealPlans.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Slot × Day grid */}
          {selectedPlan && orderedSlots.length > 0 && (
            <>
              {/* Mobile: lista vertical por slot */}
              <div className="space-y-3 md:hidden">
                {orderedSlots.map(slot => (
                  <div key={slot.id} className="rounded-lg border p-3">
                    <p className="text-sm font-semibold mb-2">{slot.name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {weekDays.map(day => {
                        const dayPlan = selectedPlan.days.find(d => d.day === day.value);
                        const meal = dayPlan?.meals.find(m => m.slotId === slot.id);
                        if (!meal) {
                          return (
                            <div key={day.value} className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
                              <span className="w-10">{day.short}</span>
                              <span>—</span>
                            </div>
                          );
                        }
                        return (
                          <label
                            key={day.value}
                            className="flex items-center gap-2 rounded-md border px-2 py-2 text-sm cursor-pointer hover:bg-secondary min-h-[44px]"
                          >
                            <Checkbox
                              checked={selectedMealIds.has(meal.id)}
                              onCheckedChange={() => onToggleMealId(meal.id)}
                            />
                            <span>{day.short}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: tabela */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left text-xs font-semibold text-muted-foreground">Refeição</th>
                      {weekDays.map(d => (
                        <th key={d.value} className="p-2 text-center text-xs font-semibold text-muted-foreground">{d.short}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orderedSlots.map(slot => (
                      <tr key={slot.id} className="border-b last:border-b-0">
                        <td className="p-2 text-xs font-medium whitespace-nowrap">{slot.name}</td>
                        {weekDays.map(day => {
                          const dayPlan = selectedPlan.days.find(d => d.day === day.value);
                          const meal = dayPlan?.meals.find(m => m.slotId === slot.id);
                          if (!meal) return <td key={day.value} className="p-2 text-center"><span className="text-muted-foreground">—</span></td>;
                          return (
                            <td key={day.value} className="p-2 text-center">
                              <Checkbox
                                checked={selectedMealIds.has(meal.id)}
                                onCheckedChange={() => onToggleMealId(meal.id)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            onClick={onApply}
            className="bg-gradient-primary"
            disabled={selectedMealIds.size === 0}
          >
            Aplicar ({selectedMealIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
