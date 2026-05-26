import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Users, Link2, Copy, Check, LogOut, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { useMealPlans } from '@/hooks/useMealPlans';
import { MealSlotGrid } from '@/components/shared/MealSlotGrid';
import { ShoppingList } from '@/types';
import { shoppingListService } from '@/services/shoppingListService';
import { toast } from 'sonner';

export default function ShoppingListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mealPlans } = useMealPlans();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedMealIds, setSelectedMealIds] = useState<Set<string>>(new Set());
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await shoppingListService.getById(id);
      setList(data);
      setSelectedMealIds(new Set(data.selectedMealIds));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar lista');
      navigate('/listas-compras');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleSaveSelection = async () => {
    if (!id) return;
    try {
      const updated = await shoppingListService.setMeals(id, Array.from(selectedMealIds));
      setList(updated);
      setSelectionOpen(false);
      toast.success('Refeições atualizadas');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  };

  const handleGenerateInvite = async () => {
    if (!id) return;
    try {
      await shoppingListService.generateInvite(id);
      load();
      setInviteOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar convite');
    }
  };

  const handleRevokeInvite = async () => {
    if (!id) return;
    try {
      await shoppingListService.revokeInvite(id);
      load();
      toast.success('Convite revogado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao revogar');
    }
  };

  const handleLeave = async () => {
    if (!id || !confirm('Sair dessa lista?')) return;
    try {
      await shoppingListService.leave(id);
      navigate('/listas-compras');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao sair');
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!id || !confirm('Remover esse membro?')) return;
    try {
      await shoppingListService.removeMember(id, memberUserId);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover');
    }
  };

  const togglePlan = (planId: string) => {
    setExpandedPlans(prev => {
      const next = new Set(prev);
      if (next.has(planId)) next.delete(planId);
      else next.add(planId);
      return next;
    });
  };

  const toggleMeal = (mealId: string) => {
    setSelectedMealIds(prev => {
      const next = new Set(prev);
      if (next.has(mealId)) next.delete(mealId);
      else next.add(mealId);
      return next;
    });
  };

  const toggleAllPlanMeals = (plan: typeof mealPlans[number]) => {
    const allMealIds = plan.days.flatMap(d => d.meals.map(m => m.id));
    const allSelected = allMealIds.every(id => selectedMealIds.has(id));
    setSelectedMealIds(prev => {
      const next = new Set(prev);
      allMealIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const inviteUrl = useMemo(() => {
    if (!list?.inviteToken) return '';
    return `${window.location.origin}/listas-compras/aceitar/${list.inviteToken}`;
  }, [list?.inviteToken]);

  const copyInvite = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <p className="text-center py-12 text-muted text-[13px]">Carregando...</p>;
  if (!list) return null;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <Link
            to="/listas-compras"
            className="eyebrow inline-flex items-center gap-1 mb-2 hover:text-ink transition-colors"
          >
            ← LISTAS
          </Link>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] leading-[1.1]">
            {list.name}
          </h1>
          <p className="mono text-[11.5px] text-muted mt-2">
            {list.isOwner ? 'Você é dono' : `Convidado por ${list.ownerName}`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {!list.isOwner && (
            <Button variant="sec" onClick={handleLeave}>
              <LogOut size={14} />
              Sair
            </Button>
          )}
          {list.isOwner && (
            <Button variant="sec" onClick={list.inviteToken ? () => setInviteOpen(true) : handleGenerateInvite}>
              <Link2 size={14} />
              {list.inviteToken ? 'Ver convite' : 'Convidar'}
            </Button>
          )}
          <Button variant="acc" onClick={() => setSelectionOpen(true)}>
            <ShoppingCart size={14} />
            Selecionar refeições ({list.selectedMealIds.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-5">
        {/* Items */}
        <div className="bg-surface border border-line rounded-lg shadow-1 overflow-hidden">
          <div className="px-4 py-3 border-b border-line">
            <span className="font-semibold text-[14.5px]">Lista de compras</span>
          </div>
          {list.items.length === 0 ? (
            <div className="p-8 text-center text-muted text-[13px]">
              Selecione refeições para gerar a lista.
            </div>
          ) : (
            <div>
              {list.items.map((item) => (
                <div key={item.foodId} className="flex justify-between px-4 py-2.5 border-b border-line last:border-b-0">
                  <span className="font-medium text-[13.5px]">{item.foodName}</span>
                  <span className="num text-[13px] text-muted">
                    {item.quantity.toFixed(0)}{item.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members */}
        {(list.members.length > 0 || list.isOwner) && (
          <div className="bg-surface border border-line rounded-lg shadow-1 overflow-hidden h-fit">
            <div className="px-4 py-3 border-b border-line flex items-center gap-2">
              <Users size={14} className="text-muted" />
              <span className="font-semibold text-[14.5px]">Pessoas ({list.members.length + 1})</span>
            </div>
            <div>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
                <div className="flex items-center gap-2">
                  <div className="w-[28px] h-[28px] rounded-md bg-ink text-bg grid place-items-center font-mono text-[11px] font-medium">
                    {list.ownerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium text-[13px]">{list.ownerName}</span>
                    <span className="mono text-[10px] text-muted ml-1.5">Dono</span>
                  </div>
                </div>
              </div>
              {list.members.map((m) => (
                <div key={m.userId} className="flex items-center justify-between px-4 py-2.5 border-b border-line last:border-b-0 group">
                  <div className="flex items-center gap-2">
                    <div className="w-[28px] h-[28px] rounded-md bg-surface-alt text-ink grid place-items-center font-mono text-[11px] font-medium">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium text-[13px]">{m.name}</span>
                      <span className="mono text-[10px] text-muted ml-1.5">{m.email}</span>
                    </div>
                  </div>
                  {list.isOwner && (
                    <button
                      className="w-[26px] h-[26px] rounded-sm grid place-items-center text-muted hover:bg-surface-alt hover:text-danger opacity-0 group-hover:opacity-100 transition-[background,color,opacity] duration-[120ms]"
                      onClick={() => handleRemoveMember(m.userId)}
                    >
                      <X size={13} strokeWidth={1.6} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Meal Selection Dialog */}
      <Dialog open={selectionOpen} onOpenChange={setSelectionOpen}>
        <DialogContent lg>
          <DialogHeader>
            <DialogTitle>Selecionar refeições</DialogTitle>
            <DialogDescription>
              Marque as refeições que devem entrar na lista de compras.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {mealPlans.length === 0 ? (
              <p className="text-center text-muted py-6 text-[13px]">
                Você não tem planos alimentares cadastrados.
              </p>
            ) : (
              mealPlans.map((plan) => {
                const isExpanded = expandedPlans.has(plan.id);
                const allMealIds = plan.days.flatMap(d => d.meals.map(m => m.id));
                const planMealCount = allMealIds.filter(id => selectedMealIds.has(id)).length;
                const allSelected = allMealIds.length > 0 && allMealIds.every(id => selectedMealIds.has(id));

                return (
                  <div key={plan.id} className="border border-line rounded-[var(--r-md)] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => togglePlan(plan.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-surface-alt transition-[background] duration-[120ms]"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        <span className="font-medium text-[13.5px]">{plan.name}</span>
                        {planMealCount > 0 && (
                          <span className="mono text-[10px] bg-accent-soft text-accent px-2 py-0.5 rounded-full font-medium">
                            {planMealCount}
                          </span>
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-line p-3">
                        <MealSlotGrid
                          plan={plan}
                          selectedMealIds={selectedMealIds}
                          onToggleMeal={toggleMeal}
                          showSelectAll
                          onToggleAll={() => toggleAllPlanMeals(plan)}
                          allSelected={allSelected}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button variant="acc" onClick={handleSaveSelection}>
              Salvar seleção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convite</DialogTitle>
            <DialogDescription>
              Compartilhe esse link. O convite expira em{' '}
              {list.inviteExpiresAt && new Date(list.inviteExpiresAt).toLocaleDateString('pt-BR')}.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 px-3 py-2 text-[13px] mono bg-surface-alt rounded-[var(--r-md)] border border-line"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button variant="sec" size="icon" onClick={copyInvite}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
            <Button variant="danger" className="w-full" onClick={handleRevokeInvite}>
              Revogar convite
            </Button>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
