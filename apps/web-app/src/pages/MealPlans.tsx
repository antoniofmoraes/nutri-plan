import { useState } from 'react';
import { Plus, Edit, Trash2, ChevronRight, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMealPlan } from '@/contexts/MealPlanContext';
import { MealPlan, PlanGoal } from '@/types';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const goalLabels: Record<PlanGoal, string> = {
  manter: 'Manutenção',
  ganhar: 'Ganho de Massa',
  emagrecer: 'Emagrecimento',
};

const goalColors: Record<PlanGoal, string> = {
  manter: 'bg-info/10 text-info',
  ganhar: 'bg-success/10 text-success',
  emagrecer: 'bg-accent/10 text-accent',
};

export default function MealPlans() {
  const { mealPlans, addMealPlan, updateMealPlan, deleteMealPlan, calculatePlanMacros } = useMealPlan();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    goal: 'manter' as PlanGoal,
    dailyCalories: 2000,
    dailyProtein: undefined as number | undefined,
    dailyCarbs: undefined as number | undefined,
    dailyFat: undefined as number | undefined,
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      goal: 'manter',
      dailyCalories: 2000,
      dailyProtein: undefined,
      dailyCarbs: undefined,
      dailyFat: undefined,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (plan: MealPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      goal: plan.goal,
      dailyCalories: plan.dailyCalories,
      dailyProtein: plan.dailyProtein ?? undefined,
      dailyCarbs: plan.dailyCarbs ?? undefined,
      dailyFat: plan.dailyFat ?? undefined,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.dailyCalories) return;

    const planData = {
      name: formData.name,
      goal: formData.goal,
      dailyCalories: formData.dailyCalories,
      dailyProtein: formData.dailyProtein || null,
      dailyCarbs: formData.dailyCarbs || null,
      dailyFat: formData.dailyFat || null,
    };

    if (editingPlan) {
      updateMealPlan(editingPlan.id, planData);
    } else {
      addMealPlan(planData);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteMealPlan(id);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">
            Planos Alimentares
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie seus planos semanais de alimentação
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} className="bg-gradient-primary hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingPlan ? 'Editar Plano' : 'Novo Plano Alimentar'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Nome do Plano</Label>
                <Input
                  id="plan-name"
                  placeholder="Ex: Dieta de Verão"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-goal">Objetivo</Label>
                <Select
                  value={formData.goal}
                  onValueChange={(v) => setFormData({ ...formData, goal: v as PlanGoal })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manter">Manutenção</SelectItem>
                    <SelectItem value="ganhar">Ganho de Massa</SelectItem>
                    <SelectItem value="emagrecer">Emagrecimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="daily-calories">Calorias Diárias (kcal) *</Label>
                <Input
                  id="daily-calories"
                  type="number"
                  placeholder="Ex: 2000"
                  value={formData.dailyCalories}
                  onChange={(e) => setFormData({ ...formData, dailyCalories: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="daily-protein">Proteína (g)</Label>
                  <Input
                    id="daily-protein"
                    type="number"
                    placeholder="Ex: 150"
                    value={formData.dailyProtein ?? ''}
                    onChange={(e) => setFormData({ ...formData, dailyProtein: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily-carbs">Carboidratos (g)</Label>
                  <Input
                    id="daily-carbs"
                    type="number"
                    placeholder="Ex: 250"
                    value={formData.dailyCarbs ?? ''}
                    onChange={(e) => setFormData({ ...formData, dailyCarbs: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily-fat">Gordura (g)</Label>
                  <Input
                    id="daily-fat"
                    type="number"
                    placeholder="Ex: 65"
                    value={formData.dailyFat ?? ''}
                    onChange={(e) => setFormData({ ...formData, dailyFat: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleSubmit} className="bg-gradient-primary hover:opacity-90">
                {editingPlan ? 'Salvar' : 'Criar Plano'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {mealPlans.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground font-display">
              Nenhum plano cadastrado
            </h3>
            <p className="mt-2 text-center text-muted-foreground">
              Crie seu primeiro plano alimentar para começar a organizar sua dieta.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mealPlans.map((plan) => {
            const macros = calculatePlanMacros(plan);
            return (
              <Card
                key={plan.id}
                className="group cursor-pointer overflow-hidden transition-all hover:shadow-medium hover:-translate-y-1"
                onClick={() => navigate(`/planos/${plan.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="font-display text-lg">{plan.name}</CardTitle>
                      <span className={cn('mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', goalColors[plan.goal])}>
                        {goalLabels[plan.goal]}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(plan);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(plan.id);
                        }}
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <p>Média diária:</p>
                      <p className="font-medium text-foreground">
                        {macros.calories.toFixed(0)} kcal
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
