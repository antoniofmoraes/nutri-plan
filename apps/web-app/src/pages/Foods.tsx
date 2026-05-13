import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Apple, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMealPlan } from '@/contexts/MealPlanContext';
import { Food } from '@/types';
import { foodService } from '@/services/foodService';

const PAGE_SIZE = 50;

export default function Foods() {
  const { addFood, updateFood, deleteFood } = useMealPlan();
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fibers: '',
    portion: '',
  });

  const loaderRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

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

  useEffect(() => {
    fetchFoods(1, searchQuery, true);
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchFoods(1, searchQuery, true);
    }, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
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
    setFormData({ name: '', calories: '', protein: '', carbs: '', fat: '', fibers: '', portion: '100g' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (food: Food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      calories: food.calories.toString(),
      protein: food.protein.toString(),
      carbs: food.carbs.toString(),
      fat: food.fat.toString(),
      fibers: food.fibers.toString(),
      portion: food.portion || '100g',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    const foodData = {
      name: formData.name,
      calories: Number(formData.calories) || 0,
      protein: Number(formData.protein) || 0,
      carbs: Number(formData.carbs) || 0,
      fat: Number(formData.fat) || 0,
      fibers: Number(formData.fibers) || 0,
      portion: formData.portion || '100g',
    };

    if (editingFood) {
      await updateFood(editingFood.id, foodData);
    } else {
      await addFood(foodData);
    }
    setDialogOpen(false);
    fetchFoods(1, searchQuery, true);
  };

  const handleDelete = async (id: string) => {
    await deleteFood(id);
    setFoods(prev => prev.filter(f => f.id !== id));
    setTotal(prev => prev - 1);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">
            Alimentos
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie sua base de alimentos
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="bg-gradient-primary hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" />
          Novo Alimento
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar alimentos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Foods Table */}
      {foods.length === 0 && !isLoading ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Apple className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground font-display">
              {searchQuery ? 'Nenhum alimento encontrado' : 'Nenhum alimento cadastrado'}
            </h3>
            <p className="mt-2 text-center text-muted-foreground">
              {searchQuery
                ? 'Tente buscar com outros termos'
                : 'Adicione alimentos para usar em suas refeições'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alimento</TableHead>
                  <TableHead className="text-right">Calorias</TableHead>
                  <TableHead className="text-right">Proteína</TableHead>
                  <TableHead className="text-right">Carbos</TableHead>
                  <TableHead className="text-right">Gordura</TableHead>
                  <TableHead className="text-right">Fibras</TableHead>
                  <TableHead className="text-right">Porção</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {foods.map((food) => (
                  <TableRow key={food.id}>
                    <TableCell className="font-medium">{food.name}</TableCell>
                    <TableCell className="text-right text-accent font-medium">
                      {food.calories} kcal
                    </TableCell>
                    <TableCell className="text-right text-protein">
                      {food.protein}g
                    </TableCell>
                    <TableCell className="text-right text-carbs">
                      {food.carbs}g
                    </TableCell>
                    <TableCell className="text-right text-fat">
                      {food.fat}g
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {food.fibers}g
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {food.portion}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(food)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(food.id)}
                          className="hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Infinite scroll trigger */}
          <div ref={loaderRef} className="flex justify-center py-4">
            {isLoading && (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
            {!hasMore && foods.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Todos os {total} alimentos carregados
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingFood ? 'Editar Alimento' : 'Novo Alimento'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Frango Grelhado"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Calorias (kcal)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Porção</Label>
                <Input
                  placeholder="100g"
                  value={formData.portion}
                  onChange={(e) => setFormData({ ...formData, portion: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Proteína (g)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.protein}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Carboidratos (g)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.carbs}
                  onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Gordura (g)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.fat}
                  onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fibras (g)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.fibers}
                  onChange={(e) => setFormData({ ...formData, fibers: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSubmit} className="bg-gradient-primary hover:opacity-90">
              {editingFood ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
