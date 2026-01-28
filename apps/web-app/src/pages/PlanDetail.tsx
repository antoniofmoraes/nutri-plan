import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMealPlan } from '@/contexts/MealPlanContext';
import { WeekDay, Meal, Food } from '@/types';
import { cn } from '@/lib/utils';

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
    addMealToDay,
    updateMeal,
    deleteMeal,
    addFoodToMeal,
    removeFoodFromMeal,
    calculateMealMacros,
    calculateDayMacros,
  } = useMealPlan();

  const plan = mealPlans.find((p) => p.id === id);
  const [selectedDay, setSelectedDay] = useState<WeekDay>('segunda');
  
  // Meal dialog state
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [mealForm, setMealForm] = useState({ name: '', time: '' });

  // Food dialog state
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [targetMealId, setTargetMealId] = useState<string | null>(null);
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [foodQuantity, setFoodQuantity] = useState('100');

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
  const dayMacros = dayPlan ? calculateDayMacros(dayPlan) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const handleOpenMealDialog = (meal?: Meal) => {
    if (meal) {
      setEditingMeal(meal);
      setMealForm({ name: meal.name, time: meal.time || '' });
    } else {
      setEditingMeal(null);
      setMealForm({ name: '', time: '' });
    }
    setMealDialogOpen(true);
  };

  const handleSaveMeal = () => {
    if (!mealForm.name.trim()) return;

    if (editingMeal) {
      updateMeal(plan.id, selectedDay, editingMeal.id, {
        name: mealForm.name,
        time: mealForm.time || undefined,
      });
    } else {
      addMealToDay(plan.id, selectedDay, {
        name: mealForm.name,
        time: mealForm.time || undefined,
        foods: [],
      });
    }
    setMealDialogOpen(false);
  };

  const handleDeleteMeal = (mealId: string) => {
    deleteMeal(plan.id, selectedDay, mealId);
  };

  const handleOpenFoodDialog = (mealId: string) => {
    setTargetMealId(mealId);
    setSelectedFoodId('');
    setFoodQuantity('100');
    setFoodDialogOpen(true);
  };

  const handleAddFood = () => {
    if (!targetMealId || !selectedFoodId) return;
    const food = foods.find((f) => f.id === selectedFoodId);
    if (!food) return;

    addFoodToMeal(plan.id, selectedDay, targetMealId, food, Number(foodQuantity));
    setFoodDialogOpen(false);
  };

  const handleRemoveFood = (mealId: string, foodId: string) => {
    removeFoodFromMeal(plan.id, selectedDay, mealId, foodId);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/planos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">{plan.name}</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as refeições da semana
          </p>
        </div>
      </div>

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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold font-display">{day.label}</h3>
                <Button size="sm" onClick={() => handleOpenMealDialog()}>
                  <Plus className="mr-1 h-4 w-4" />
                  Refeição
                </Button>
              </div>

              {currentDayPlan?.meals.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-muted p-8 text-center">
                  <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    Nenhuma refeição cadastrada
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentDayPlan?.meals.map((meal) => {
                    const macros = calculateMealMacros(meal);
                    return (
                      <Card key={meal.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base font-display">{meal.name}</CardTitle>
                              {meal.time && (
                                <span className="text-xs text-muted-foreground">• {meal.time}</span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenMealDialog(meal)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:text-destructive"
                                onClick={() => handleDeleteMeal(meal.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span className="text-accent font-medium">{macros.calories.toFixed(0)} kcal</span>
                            <span>P: {macros.protein.toFixed(0)}g</span>
                            <span>C: {macros.carbs.toFixed(0)}g</span>
                            <span>G: {macros.fat.toFixed(0)}g</span>
                          </div>
                        </CardHeader>
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
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Meal Dialog */}
      <Dialog open={mealDialogOpen} onOpenChange={setMealDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingMeal ? 'Editar Refeição' : 'Nova Refeição'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Refeição</Label>
              <Input
                placeholder="Ex: Café da manhã"
                value={mealForm.name}
                onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Horário (opcional)</Label>
              <Input
                placeholder="Ex: 07:00"
                value={mealForm.time}
                onChange={(e) => setMealForm({ ...mealForm, time: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSaveMeal} className="bg-gradient-primary">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Food Dialog */}
      <Dialog open={foodDialogOpen} onOpenChange={setFoodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Adicionar Alimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Alimento</Label>
              <Select value={selectedFoodId} onValueChange={setSelectedFoodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um alimento" />
                </SelectTrigger>
                <SelectContent>
                  {foods.map((food) => (
                    <SelectItem key={food.id} value={food.id}>
                      {food.name} ({food.calories} kcal/100g)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button onClick={handleAddFood} className="bg-gradient-primary">
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
