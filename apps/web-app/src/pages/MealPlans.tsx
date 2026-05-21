import { useState } from 'react';
import { Plus, Edit, Trash2, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogDescription,
  DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMealPlans } from '@/hooks/useMealPlans';
import { calculatePlanMacros } from '@/lib/macros';
import { MealPlan, PlanGoal } from '@/types';
import { useNavigate } from 'react-router-dom';
import { CalendarRange } from 'lucide-react';

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

const goalStyle: Record<PlanGoal, { bg: string; fg: string }> = {
  manter: { bg: 'color-mix(in oklab, var(--m-pro) 14%, transparent)', fg: 'var(--m-pro)' },
  emagrecer: { bg: 'color-mix(in oklab, var(--m-cal) 14%, transparent)', fg: 'var(--m-cal)' },
  ganhar: { bg: 'color-mix(in oklab, var(--m-fat) 14%, transparent)', fg: 'var(--m-fat)' },
};

export default function MealPlans() {
  const { mealPlans, addMealPlan, updateMealPlan, deleteMealPlan, setMainPlan } = useMealPlans();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteMealPlan(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-2">Coleção</div>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] leading-[1.1]">
            Planos alimentares
          </h1>
          <p className="text-muted mt-2 max-w-[56ch] text-sm">
            Crie e gerencie diferentes planos — para cutting, bulking ou manutenção.
            Marque um como principal para vê-lo na dashboard.
          </p>
        </div>
        <Button variant="acc" onClick={handleOpenCreate}>
          <Plus size={16} />
          Novo plano
        </Button>
      </div>

      {/* Grid or empty state */}
      {mealPlans.length === 0 ? (
        <div className="bg-surface border border-line rounded-lg shadow-1 p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-lg bg-accent-soft text-accent grid place-items-center mb-4">
            <CalendarRange size={26} strokeWidth={1.6} />
          </div>
          <h3 className="text-[19px] font-semibold mb-1.5">Nenhum plano alimentar</h3>
          <p className="text-muted max-w-[360px] mb-5">
            Crie seu primeiro plano para começar a organizar suas refeições.
          </p>
          <Button variant="acc" onClick={handleOpenCreate}>
            <Plus size={16} />
            Criar primeiro plano
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {mealPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onOpen={() => navigate(`/planos/${plan.id}`)}
              onSetMain={() => setMainPlan(plan.isMain ? null : plan.id)}
              onEdit={() => handleOpenEdit(plan)}
              onDelete={() => setDeleteTarget(plan.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar plano' : 'Novo plano alimentar'}</DialogTitle>
            <DialogDescription>
              Defina meta calórica e macros. Você pode editar depois.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody>
              <div>
                <label className="label-mono">Nome</label>
                <Input placeholder="Ex: Cutting março" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-xs text-danger mt-1.5">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="label-mono">Objetivo</label>
                <Select
                  value={form.watch('goal')}
                  onValueChange={(v) => form.setValue('goal', v as PlanGoal)}
                >
                  <SelectTrigger className="bg-surface border-line rounded-[var(--r-md)] h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emagrecer">Emagrecimento</SelectItem>
                    <SelectItem value="manter">Manutenção</SelectItem>
                    <SelectItem value="ganhar">Ganho de Massa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="label-mono">Calorias diárias (kcal)</label>
                <Input type="number" inputMode="decimal" placeholder="Ex: 2200" {...form.register('dailyCalories')} />
                {form.formState.errors.dailyCalories && (
                  <p className="text-xs text-danger mt-1.5">{form.formState.errors.dailyCalories.message}</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="label-mono">Proteína (g)</label>
                  <Input type="number" inputMode="decimal" placeholder="165" {...form.register('dailyProtein')} />
                </div>
                <div>
                  <label className="label-mono">Carbo. (g)</label>
                  <Input type="number" inputMode="decimal" placeholder="240" {...form.register('dailyCarbs')} />
                </div>
                <div>
                  <label className="label-mono">Gordura (g)</label>
                  <Input type="number" inputMode="decimal" placeholder="70" {...form.register('dailyFat')} />
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" type="button">Cancelar</Button>
              </DialogClose>
              <Button variant="acc" type="submit">
                {editingPlan ? 'Salvar' : 'Criar plano'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir este plano?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanCard({
  plan,
  onOpen,
  onSetMain,
  onEdit,
  onDelete,
}: {
  plan: MealPlan;
  onOpen: () => void;
  onSetMain: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const macros = calculatePlanMacros(plan);
  const gs = goalStyle[plan.goal];

  return (
    <div
      className="bg-surface border border-line rounded-lg shadow-1 overflow-hidden cursor-pointer transition-shadow duration-[120ms] hover:shadow-2"
      onClick={onOpen}
    >
      <div className="p-[22px]">
        <div className="flex justify-between items-start mb-3.5">
          <span
            className="inline-flex items-center gap-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] px-2 py-1 rounded-full leading-none"
            style={{ background: gs.bg, color: gs.fg }}
          >
            {goalLabels[plan.goal]}
          </span>
          {plan.isMain ? (
            <span className="text-accent flex" title="Plano principal">
              <Star size={18} fill="currentColor" />
            </span>
          ) : (
            <button
              className="w-[30px] h-[30px] rounded-lg grid place-items-center text-muted hover:bg-surface-alt hover:text-ink transition-[background,color] duration-[120ms]"
              onClick={(e) => { e.stopPropagation(); onSetMain(); }}
              title="Tornar principal"
            >
              <Star size={16} strokeWidth={1.6} />
            </button>
          )}
        </div>
        <h3 className="text-[18px] font-semibold tracking-[-0.01em] mb-1">{plan.name}</h3>
        <div className="mono text-[11.5px] text-muted">
          ~{Math.round(macros.calories).toLocaleString("pt-BR")} kcal/dia · {plan.slots.length} refeições
        </div>
      </div>
      <div className="border-t border-line bg-surface-alt px-3.5 py-2.5 flex justify-between items-center gap-2">
        <div className="mono text-[10.5px] text-muted flex gap-3 uppercase tracking-[0.06em]">
          <span>P · {Math.round(macros.protein)}</span>
          <span>C · {Math.round(macros.carbs)}</span>
          <span>G · {Math.round(macros.fat)}</span>
        </div>
        <div className="flex gap-1">
          <button
            className="w-[26px] h-[26px] rounded-sm grid place-items-center text-muted hover:bg-surface hover:text-ink transition-[background,color] duration-[120ms]"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            <Edit size={14} strokeWidth={1.6} />
          </button>
          <button
            className="w-[26px] h-[26px] rounded-sm grid place-items-center text-muted hover:bg-surface hover:text-danger transition-[background,color] duration-[120ms]"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 size={14} strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </div>
  );
}
