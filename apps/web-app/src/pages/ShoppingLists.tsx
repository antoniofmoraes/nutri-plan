import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShoppingCart, Users, Crown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingListSummary } from '@/types';
import { shoppingListService } from '@/services/shoppingListService';
import { toast } from 'sonner';

export default function ShoppingLists() {
  const [lists, setLists] = useState<ShoppingListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      setLists(await shoppingListService.getAll());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar listas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await shoppingListService.create(name.trim());
      setName('');
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar lista');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apagar essa lista?')) return;
    try {
      await shoppingListService.delete(id);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Listas de Compras</h1>
          <p className="mt-1 text-muted-foreground">Compartilhe listas com a família</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-gradient-primary">
          <Plus className="mr-2 h-4 w-4" />
          Nova Lista
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">Carregando...</p>
      ) : lists.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold font-display">Nenhuma lista ainda</h3>
            <p className="mt-2 text-center text-muted-foreground">
              Crie uma lista para começar a organizar suas compras
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Card key={list.id} className="hover:shadow-medium transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/listas-compras/${list.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold font-display truncate">{list.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      {list.isOwner ? (
                        <><Crown className="h-3 w-3" /> Você é dono</>
                      ) : (
                        <>Convidado por {list.ownerName}</>
                      )}
                    </p>
                  </Link>
                  {list.isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-destructive"
                      onClick={() => handleDelete(list.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <Link to={`/listas-compras/${list.id}`} className="block">
                  <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      {list.mealCount} refeições
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {list.memberCount} {list.memberCount === 1 ? 'pessoa' : 'pessoas'}
                    </span>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Nova Lista de Compras</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Lista da semana"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleCreate} className="bg-gradient-primary">Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
