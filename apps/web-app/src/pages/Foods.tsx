import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Apple, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { useFoodMutations } from '@/hooks/useFoods';
import { Food } from '@/types';
import { foodService } from '@/services/foodService';
import { useAuth } from '@/contexts/AuthContext';

const foodSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  calories: z.coerce.number().min(0, 'Valor inválido'),
  protein: z.coerce.number().min(0, 'Valor inválido'),
  carbs: z.coerce.number().min(0, 'Valor inválido'),
  fat: z.coerce.number().min(0, 'Valor inválido'),
  fibers: z.coerce.number().min(0, 'Valor inválido'),
  portion: z.string().default('100g'),
});

type FoodFormData = z.infer<typeof foodSchema>;

const PAGE_SIZE = 50;

export default function Foods() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;
  const { createFood, updateFood, deleteFood } = useFoodMutations();
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Food | null>(null);

  const form = useForm<FoodFormData>({
    resolver: zodResolver(foodSchema),
    defaultValues: { name: '', calories: 0, protein: 0, carbs: 0, fat: 0, fibers: 0, portion: '100g' },
  });

  const loaderRef = useRef<HTMLDivElement>(null);
  const isFirstLoadRef = useRef(true);

  const fetchFoods = useCallback(async (pageNum: number, search: string, reset: boolean) => {
    setIsLoading(true);
    try {
      const result = await foodService.getAll({ search: search || undefined, page: pageNum, pageSize: PAGE_SIZE });
      setFoods(prev => reset ? result.items : [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(pageNum);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load fires immediately; subsequent searches are debounced
  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      fetchFoods(1, searchQuery, true);
      return;
    }
    const timeout = setTimeout(() => fetchFoods(1, searchQuery, true), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, fetchFoods]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchFoods(page + 1, searchQuery, false);
        }
      },
      { threshold: 0.1 }
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, isLoading, page, searchQuery, fetchFoods]);

  const handleOpenCreate = () => {
    setEditingFood(null);
    form.reset({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0, fibers: 0, portion: '100g' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (food: Food) => {
    setEditingFood(food);
    form.reset({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fibers: food.fibers,
      portion: food.portion || '100g',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FoodFormData) => {
    const foodData = {
      name: data.name,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      fibers: data.fibers,
      portion: data.portion || '100g',
    };

    if (editingFood) {
      await updateFood(editingFood.id, foodData);
    } else {
      await createFood(foodData);
    }
    setDialogOpen(false);
    fetchFoods(1, searchQuery, true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    await deleteFood(id);
    setFoods(prev => prev.filter(f => f.id !== id));
    setTotal(prev => prev - 1);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-2">Base de dados</div>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] leading-[1.1]">
            Alimentos
          </h1>
          <p className="text-muted mt-2 max-w-[56ch] text-sm">
            Gerencie sua base de alimentos com valores nutricionais por porção.
          </p>
        </div>
        {isAdmin && (
          <Button variant="acc" onClick={handleOpenCreate}>
            <Plus size={16} />
            Novo alimento
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" size={16} />
          <Input
            placeholder="Buscar alimentos…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {total > 0 && (
          <span className="mono text-[11.5px] text-muted flex-shrink-0">
            {total} alimento{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Content */}
      {foods.length === 0 && !isLoading ? (
        <EmptyState
          icon={Apple}
          title={searchQuery ? 'Nenhum alimento encontrado' : 'Nenhum alimento cadastrado'}
          description={searchQuery
            ? 'Tente buscar com outros termos'
            : 'Adicione alimentos para usar em suas refeições'}
          action={!searchQuery && isAdmin && (
            <Button variant="acc" onClick={handleOpenCreate}>
              <Plus size={16} />
              Adicionar primeiro alimento
            </Button>
          )}
        />
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-2 md:hidden">
            {foods.map((food) => (
              <div key={food.id} className="bg-surface border border-line rounded-lg shadow-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14.5px] truncate">{food.name}</p>
                    <p className="mono text-[11px] text-muted mt-0.5">{food.portion}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-0.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(food)}
                      >
                        <Edit size={14} strokeWidth={1.6} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-danger"
                        onClick={() => setDeleteTarget(food)}
                      >
                        <Trash2 size={14} strokeWidth={1.6} />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-1.5">
                  <div>
                    <div className="eyebrow mb-0.5">Kcal</div>
                    <div className="num text-[13px] font-semibold" style={{ color: 'var(--m-cal)' }}>{food.calories}</div>
                  </div>
                  <div>
                    <div className="eyebrow mb-0.5">Prot</div>
                    <div className="num text-[13px] font-semibold" style={{ color: 'var(--m-pro)' }}>{food.protein}g</div>
                  </div>
                  <div>
                    <div className="eyebrow mb-0.5">Carb</div>
                    <div className="num text-[13px] font-semibold" style={{ color: 'var(--m-carb)' }}>{food.carbs}g</div>
                  </div>
                  <div>
                    <div className="eyebrow mb-0.5">Gord</div>
                    <div className="num text-[13px] font-semibold" style={{ color: 'var(--m-fat)' }}>{food.fat}g</div>
                  </div>
                  <div>
                    <div className="eyebrow mb-0.5">Fibra</div>
                    <div className="num text-[13px] font-semibold text-muted">{food.fibers}g</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-surface border border-line rounded-lg shadow-1 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-alt hover:bg-surface-alt">
                  <TableHead>Alimento</TableHead>
                  <TableHead className="text-right">Calorias</TableHead>
                  <TableHead className="text-right">Proteína</TableHead>
                  <TableHead className="text-right">Carbos</TableHead>
                  <TableHead className="text-right">Gordura</TableHead>
                  <TableHead className="text-right">Fibras</TableHead>
                  <TableHead className="text-right">Porção</TableHead>
                  {isAdmin && <TableHead className="w-20"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {foods.map((food) => (
                  <TableRow key={food.id}>
                    <TableCell className="font-medium text-[13.5px]">{food.name}</TableCell>
                    <TableCell className="text-right">
                      <span className="num text-[13px] font-semibold" style={{ color: 'var(--m-cal)' }}>
                        {food.calories}
                      </span>
                      <span className="mono text-[10.5px] text-muted ml-0.5">kcal</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="num text-[13px]" style={{ color: 'var(--m-pro)' }}>{food.protein}g</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="num text-[13px]" style={{ color: 'var(--m-carb)' }}>{food.carbs}g</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="num text-[13px]" style={{ color: 'var(--m-fat)' }}>{food.fat}g</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="num text-[13px] text-muted">{food.fibers}g</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="mono text-[11px] text-muted">{food.portion}</span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5">
                          <Button variant="ghost" size="icon-xs" onClick={() => handleOpenEdit(food)}>
                            <Edit size={14} strokeWidth={1.6} />
                          </Button>
                          <Button variant="ghost" size="icon-xs" className="hover:text-danger" onClick={() => setDeleteTarget(food)}>
                            <Trash2 size={14} strokeWidth={1.6} />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Infinite scroll trigger */}
          <div ref={loaderRef} className="flex justify-center py-4">
            {isLoading && (
              <Loader2 className="h-5 w-5 animate-spin text-muted" />
            )}
            {!hasMore && foods.length > 0 && (
              <p className="mono text-[11.5px] text-muted">
                Todos os {total} alimentos carregados
              </p>
            )}
          </div>
        </>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFood ? 'Editar alimento' : 'Novo alimento'}
            </DialogTitle>
            <DialogDescription>
              Informe os valores nutricionais por porção.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody>
              <div className="grid grid-cols-[1fr_auto] gap-2.5">
                <div>
                  <label className="label-mono">Nome</label>
                  <Input placeholder="Ex: Frango grelhado" {...form.register('name')} />
                  {form.formState.errors.name && (
                    <p className="text-xs text-danger mt-1.5">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="label-mono">Porção</label>
                  <Input placeholder="100g" {...form.register('portion')} className="w-24" />
                </div>
              </div>
              <div>
                <label className="label-mono">Calorias (kcal)</label>
                <Input type="number" inputMode="decimal" placeholder="0" {...form.register('calories')} />
                {form.formState.errors.calories && (
                  <p className="text-xs text-danger mt-1.5">{form.formState.errors.calories.message}</p>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                <div>
                  <label className="label-mono">Proteína (g)</label>
                  <Input type="number" inputMode="decimal" placeholder="0" {...form.register('protein')} />
                </div>
                <div>
                  <label className="label-mono">Carbo. (g)</label>
                  <Input type="number" inputMode="decimal" placeholder="0" {...form.register('carbs')} />
                </div>
                <div>
                  <label className="label-mono">Gordura (g)</label>
                  <Input type="number" inputMode="decimal" placeholder="0" {...form.register('fat')} />
                </div>
                <div>
                  <label className="label-mono">Fibras (g)</label>
                  <Input type="number" inputMode="decimal" placeholder="0" {...form.register('fibers')} />
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button type="submit" variant="acc">
                {editingFood ? 'Salvar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={`Excluir "${deleteTarget?.name}"?`}
        description="O alimento será removido do catálogo. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
