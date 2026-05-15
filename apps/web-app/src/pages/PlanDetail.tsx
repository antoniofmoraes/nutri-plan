import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Clock, X, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMealPlan } from '@/contexts/MealPlanContext';
import { WeekDay, MealSlot } from '@/types';

const weekDays: { value: WeekDay; label: string; short: string }[] = [
  { value: 'segunda', label: 'Segunda', short: 'Seg' },
  { value: 'terca', label: 'Terça', short: 'Ter' },
  { value: 'quarta', label: 'Quarta', short: 'Qua' },
  { value: 'quinta', label: 'Quinta', short: 'Qui' },
  { value: 'sexta', label: 'Sexta', short: 'Sex' },
  { value: 'sabado', label: 'Sábado', short: 'Sáb' },
  { value: 'domingo', label: 'Domingo', short: 'Dom' },
];

export default function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    mealPlans,
    foods,
    addSlot,
    updateSlot,
    deleteSlot,
    addFoodToMeal,
    removeFoodFromMeal,
    setMealCheat,
    calculateMealMacros,
    calculateDayMacros,
  } = useMealPlan();

  const plan = mealPlans.find((p) => p.id === id);
  const [selectedDay, setSelectedDay] = useState<WeekDay>('segunda');

  // Slot dialog state
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<MealSlot | null>(null);
  const [slotForm, setSlotForm] = useState({ name: '', time: '' });

  // Food dialog state
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [targetMealId, setTargetMealId] = useState<string | null>(null);
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [foodQuantity, setFoodQuantity] = useState('100');
  const [foodSearch, setFoodSearch] = useState('');

  const filteredFoods = useMemo(() => {
    const q = foodSearch.trim().toLowerCase();
    const list = q ? foods.filter(f => f.name.toLowerCase().includes(q)) : foods;
    return list.slice(0, 100);
  }, [foods, foodSearch]);

  const selectedFood = foods.find(f => f.id === selectedFoodId);

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Plano não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/planos')} className="mt-4">
          Voltar para Planos
        </Button>
      </div>
    );
  }

  const dayPlan = plan.days.find((d) => d.day === selectedDay);
  const dayMacros = dayPlan ? calculateDayMacros(dayPlan, plan) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const handleToggleCheat = async (mealId: string, currentlyCheat: boolean) => {
    try {
      await setMealCheat(plan.id, mealId, !currentlyCheat);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar');
    }
  };

  const handleOpenSlotDialog = (slot?: MealSlot) => {
    if (slot) {
      setEditingSlot(slot);
      setSlotForm({ name: slot.name, time: slot.time || '' });
    } else {
      setEditingSlot(null);
      setSlotForm({ name: '', time: '' });
    }
    setSlotDialogOpen(true);
  };

  const handleSaveSlot = async () => {
    if (!slotForm.name.trim()) return;

    if (editingSlot) {
      await updateSlot(plan.id, editingSlot.id, {
        name: slotForm.name,
        time: slotForm.time || undefined,
      });
    } else {
      await addSlot(plan.id, {
        name: slotForm.name,
        time: slotForm.time || undefined,
      });
    }
    setSlotDialogOpen(false);
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Apagar essa refeição de todos os dias?')) return;
    await deleteSlot(plan.id, slotId);
  };

  const handleOpenFoodDialog = (mealId: string) => {
    setTargetMealId(mealId);
    setSelectedFoodId('');
    setFoodQuantity('100');
    setFoodSearch('');
    setFoodDialogOpen(true);
  };

  const handleAddFood = async () => {
    if (!targetMealId || !selectedFoodId) return;
    const food = foods.find((f) => f.id === selectedFoodId);
    if (!food) return;

    await addFoodToMeal(plan.id, targetMealId, food, Number(foodQuantity));
    setFoodDialogOpen(false);
  };

  const handleRemoveFood = async (mealId: string, foodId: string) => {
    await removeFoodFromMeal(plan.id, mealId, foodId);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/planos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground font-display">{plan.name}</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as refeições da semana
          </p>
        </div>
        <Button onClick={() => handleOpenSlotDialog()} className="bg-gradient-primary">
          <Plus className="mr-1 h-4 w-4" />
          Refeição
        </Button>
      </div>

      {/* Slot management */}
      {plan.slots.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display">Refeições do plano</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {plan.slots.map((slot) => (
              <div key={slot.id} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
                <span className="font-medium">{slot.name}</span>
                {slot.time && <span className="text-xs text-muted-foreground">• {slot.time}</span>}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-1"
                  onClick={() => handleOpenSlotDialog(slot)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 hover:text-destructive"
                  onClick={() => handleDeleteSlot(slot.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Day summary */}
      <div className="grid grid-cols-4 gap-3 rounded-xl bg-card p-4 shadow-soft">
        <div className="text-center">
          <p className="text-2xl font-bold text-accent font-display">{dayMacros.calories.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">kcal</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-protein font-display">{dayMacros.protein.toFixed(0)}g</p>
          <p className="text-xs text-muted-foreground">Proteína</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-carbs font-display">{dayMacros.carbs.toFixed(0)}g</p>
          <p className="text-xs text-muted-foreground">Carbos</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-fat font-display">{dayMacros.fat.toFixed(0)}g</p>
          <p className="text-xs text-muted-foreground">Gordura</p>
        </div>
      </div>

      {/* Day Tabs */}
      <Tabs value={selectedDay} onValueChange={(v) => setSelectedDay(v as WeekDay)}>
        <TabsList className="grid w-full grid-cols-7">
          {weekDays.map((day) => (
            <TabsTrigger key={day.value} value={day.value} className="text-xs">
              {day.short}
            </TabsTrigger>
          ))}
        </TabsList>

        {weekDays.map((day) => {
          const currentDayPlan = plan.days.find((d) => d.day === day.value);
          return (
            <TabsContent key={day.value} value={day.value} className="mt-4 space-y-4">
              <h3 className="text-lg font-semibold font-display">{day.label}</h3>

              {!currentDayPlan || currentDayPlan.meals.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-muted p-8 text-center">
                  <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    Adicione uma refeição no botão acima para começar
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentDayPlan.meals.map((meal) => {
                    const macros = calculateMealMacros(meal, plan);
                    return (
                      <Card key={meal.id} className={meal.isCheat ? 'border-accent/40 bg-accent/5' : ''}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-base font-display">{meal.name}</CardTitle>
                              {meal.time && (
                                <span className="text-xs text-muted-foreground">• {meal.time}</span>
                              )}
                              {meal.isCheat && (
                                <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  Livre
                                </span>
                              )}
                            </div>
                            <Button
                              variant={meal.isCheat ? "default" : "ghost"}
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleToggleCheat(meal.id, meal.isCheat)}
                            >
                              {meal.isCheat ? 'Cancelar livre' : 'Marcar livre'}
                            </Button>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span className="text-accent font-medium">{macros.calories.toFixed(0)} kcal</span>
                            <span>P: {macros.protein.toFixed(0)}g</span>
                            <span>C: {macros.carbs.toFixed(0)}g</span>
                            <span>G: {macros.fat.toFixed(0)}g</span>
                            {meal.isCheat && (
                              <span className="italic">(estimado pela média)</span>
                            )}
                          </div>
                        </CardHeader>
                        {!meal.isCheat && (
                          <CardContent>
                            {meal.foods.length === 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-dashed"
                                onClick={() => handleOpenFoodDialog(meal.id)}
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Adicionar alimento
                              </Button>
                            ) : (
                              <div className="space-y-2">
                                {meal.foods.map(({ food, quantity }, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm"
                                  >
                                    <div>
                                      <span className="font-medium">{food.name}</span>
                                      <span className="ml-2 text-muted-foreground">
                                        {quantity}g
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 hover:text-destructive"
                                      onClick={() => handleRemoveFood(meal.id, food.id)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => handleOpenFoodDialog(meal.id)}
                                >
                                  <Plus className="mr-1 h-3 w-3" />
                                  Mais
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Slot Dialog */}
      <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingSlot ? 'Editar Refeição' : 'Nova Refeição'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Refeição</Label>
              <Input
                placeholder="Ex: Café da manhã"
                value={slotForm.name}
                onChange={(e) => setSlotForm({ ...slotForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Horário (opcional)</Label>
              <Input
                placeholder="Ex: 07:00"
                value={slotForm.time}
                onChange={(e) => setSlotForm({ ...slotForm, time: e.target.value })}
              />
            </div>
            {!editingSlot && (
              <p className="text-xs text-muted-foreground">
                Essa refeição será criada em todos os dias da semana.
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSaveSlot} className="bg-gradient-primary">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Food Dialog with search */}
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
                      <p className="p-3 text-sm text-center text-muted-foreground">
                        Nenhum alimento encontrado
                      </p>
                    ) : (
                      filteredFoods.map((food) => (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => setSelectedFoodId(food.id)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary ${
                            selectedFoodId === food.id ? 'bg-secondary' : ''
                          }`}
                        >
                          <div className="font-medium truncate">{food.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {food.calories} kcal/100g
                          </div>
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
    </div>
  );
}
