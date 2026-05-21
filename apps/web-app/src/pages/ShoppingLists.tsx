import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShoppingCart, Users, Crown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-2">Compartilhável</div>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] leading-[1.1]">
            Listas de compras
          </h1>
          <p className="text-muted mt-2 max-w-[56ch] text-sm">
            Compartilhe listas com a família e organize suas compras.
          </p>
        </div>
        <Button variant="acc" onClick={() => setDialogOpen(true)}>
          <Plus size={16} />
          Nova lista
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <p className="text-muted text-center py-8 text-[13px]">Carregando...</p>
      ) : lists.length === 0 ? (
        <div className="bg-surface border border-line rounded-lg shadow-1 p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-lg bg-accent-soft text-accent grid place-items-center mb-4">
            <ShoppingCart size={26} strokeWidth={1.6} />
          </div>
          <h3 className="text-[19px] font-semibold mb-1.5">Nenhuma lista ainda</h3>
          <p className="text-muted max-w-[360px] mb-5">
            Crie uma lista para começar a organizar suas compras.
          </p>
          <Button variant="acc" onClick={() => setDialogOpen(true)}>
            <Plus size={16} />
            Criar primeira lista
          </Button>
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <div
              key={list.id}
              className="bg-surface border border-line rounded-lg shadow-1 overflow-hidden hover:shadow-2 transition-shadow duration-[120ms]"
            >
              <div className="p-[22px]">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/listas-compras/${list.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[18px] tracking-[-0.01em] truncate">{list.name}</h3>
                    <p className="mono text-[11px] text-muted mt-1 flex items-center gap-1">
                      {list.isOwner ? (
                        <><Crown size={11} /> Você é dono</>
                      ) : (
                        <>Convidado por {list.ownerName}</>
                      )}
                    </p>
                  </Link>
                  {list.isOwner && (
                    <button
                      className="w-[26px] h-[26px] rounded-sm grid place-items-center text-muted hover:bg-surface-alt hover:text-danger transition-[background,color] duration-[120ms]"
                      onClick={() => handleDelete(list.id)}
                    >
                      <Trash2 size={14} strokeWidth={1.6} />
                    </button>
                  )}
                </div>
              </div>
              <Link to={`/listas-compras/${list.id}`} className="block border-t border-line bg-surface-alt px-3.5 py-2.5">
                <div className="mono text-[10.5px] text-muted flex gap-3 uppercase tracking-[0.06em]">
                  <span className="flex items-center gap-1">
                    <ShoppingCart size={11} />
                    {list.mealCount} refeições
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {list.memberCount} {list.memberCount === 1 ? 'pessoa' : 'pessoas'}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova lista de compras</DialogTitle>
            <DialogDescription>
              Dê um nome para a lista.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div>
              <label className="label-mono">Nome</label>
              <Input
                placeholder="Ex: Lista da semana"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button variant="acc" onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
