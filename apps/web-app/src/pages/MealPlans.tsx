import { useState } from 'react';
import { Plus, Edit, Trash2, ChevronRight, Target, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMealPlans } from '@/hooks/useMealPlans';
import { calculatePlanMacros } from '@/lib/macros';
import { MealPlan, PlanGoal } from '@/types';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const planSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  goal: z.enum(['manter', 'ganhar', 'emagrecer']),
  dailyCalories: z.coerce.number().min(1, 'Informe as calorias diárias'),
  dailyProtein: z.coerce.number().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  dailyCarbs: z.coerce.number().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  dailyFat: z.coerce.number().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
});

type PlanFormData = z.infer<typeof planSchema>;

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
  const { mealPlans, addMealPlan, updateMealPlan, deleteMealPlan, setMainPlan } = useMealPlans();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null);

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: '', goal: 'manter', dailyCalories: 2000, dailyProtein: '', dailyCarbs: '', dailyFat: '' },
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    form.reset({ name: '', goal: 'manter', dailyCalories: 2000, dailyProtein: '', dailyCarbs: '', dailyFat: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (plan: MealPlan) => {
    setEditingPlan(plan);
    form.reset({
      name: plan.name,
      goal: plan.goal,
      dailyCalories: plan.dailyCalories,
      dailyProtein: plan.dailyProtein ?? '',
      dailyCarbs: plan.dailyCarbs ?? '',
      dailyFat: plan.dailyFat ?? '',
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: PlanFormData) => {
    const planData = {
      name: data.name,
      goal: data.goal,
      dailyCalories: data.dailyCalories,
      dailyProtein: data.dailyProtein || null,
      dailyCarbs: data.dailyCarbs || null,
      dailyFat: data.dailyFat || null,
    };

    if (editingPlan) {
      updateMealPlan(editingPlan.id, planData);
    } else {
      addMealPlan(planData);
    }
    setDialogOpen(false);
  };

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteMealPlan(deleteTarget);
      setDeleteTarget(null);
    }
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Nome do Plano</Label>
                <Input
                  id="plan-name"
                  placeholder="Ex: Dieta de Verão"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-goal">Objetivo</Label>
                <Select
                  value={form.watch('goal')}
                  onValueChange={(v) => form.setValue('goal', v as PlanGoal)}
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
                  inputMode="decimal"
                  placeholder="Ex: 2000"
                  {...form.register('dailyCalories')}
                />
                {form.formState.errors.dailyCalories && (
                  <p className="text-sm text-destructive">{form.formState.errors.dailyCalories.message}</p>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="daily-protein">Proteína (g)</Label>
                  <Input
                    id="daily-protein"
                    type="number"
                    inputMode="decimal"
                    placeholder="Ex: 150"
                    {...form.register('dailyProtein')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily-carbs">Carboidratos (g)</Label>
                  <Input
                    id="daily-carbs"
                    type="number"
                    inputMode="decimal"
                    placeholder="Ex: 250"
                    {...form.register('dailyCarbs')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily-fat">Gordura (g)</Label>
                  <Input
                    id="daily-fat"
                    type="number"
                    inputMode="decimal"
                    placeholder="Ex: 65"
                    {...form.register('dailyFat')}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                  {editingPlan ? 'Salvar' : 'Criar Plano'}
                </Button>
              </DialogFooter>
            </form>
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
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-display text-lg">{plan.name}</CardTitle>
                        {plan.isMain && (
                          <Star className="h-4 w-4 fill-favorite text-favorite" />
                        )}
                      </div>
                      <span className={cn('mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', goalColors[plan.goal])}>
                        {goalLabels[plan.goal]}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={plan.isMain ? 'Remover como principal' : 'Definir como principal'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMainPlan(plan.isMain ? null : plan.id);
                        }}
                      >
                        <Star className={cn('h-4 w-4', plan.isMain ? 'fill-favorite text-favorite' : '')} />
                      </Button>
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
                          setDeleteTarget(plan.id);
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
      {/* Delete confirmation dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Excluir plano alimentar</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.
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
    </div>
  );
}
