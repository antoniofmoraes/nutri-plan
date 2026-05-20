import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Users, Link2, Copy, Check, LogOut, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useMealPlans } from '@/hooks/useMealPlans';
import { ShoppingList, WeekDay } from '@/types';
import { weekDays } from '@/lib/constants';
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

  if (isLoading) return <p className="text-center py-12 text-muted-foreground">Carregando...</p>;
  if (!list) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/listas-compras')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-display">{list.name}</h1>
          <p className="text-sm text-muted-foreground">
            {list.isOwner ? 'Você é dono' : `Convidado por ${list.ownerName}`}
          </p>
        </div>
        {!list.isOwner && (
          <Button variant="outline" onClick={handleLeave}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button className="w-full sm:w-auto" onClick={() => setSelectionOpen(true)}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Selecionar Refeições ({list.selectedMealIds.length})
        </Button>
        {list.isOwner && (
          <Button variant="outline" onClick={list.inviteToken ? () => setInviteOpen(true) : handleGenerateInvite}>
            <Link2 className="mr-2 h-4 w-4" />
            {list.inviteToken ? 'Ver Convite' : 'Convidar'}
          </Button>
        )}
      </div>

      {/* Members */}
      {(list.members.length > 0 || list.isOwner) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Users className="h-4 w-4" /> Pessoas ({list.members.length + 1})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{list.ownerName}</span>
                <span className="ml-2 text-xs text-muted-foreground">Dono</span>
              </div>
            </div>
            {list.members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{m.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{m.email}</span>
                </div>
                {list.isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:text-destructive"
                    onClick={() => handleRemoveMember(m.userId)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display">Lista de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          {list.items.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              Selecione refeições para gerar a lista
            </p>
          ) : (
            <div className="divide-y">
              {list.items.map((item) => (
                <div key={item.foodId} className="flex justify-between py-2.5">
                  <span className="font-medium">{item.foodName}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {item.quantity.toFixed(0)}{item.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meal Selection Dialog */}
      <Dialog open={selectionOpen} onOpenChange={setSelectionOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Selecionar Refeições</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Marque as refeições que devem entrar na lista de compras
            </p>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {mealPlans.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">
                Você não tem planos alimentares cadastrados
              </p>
            ) : (
              mealPlans.map((plan) => {
                const isExpanded = expandedPlans.has(plan.id);
                const planMealCount = plan.days.reduce((sum, d) => sum + d.meals.filter(m => selectedMealIds.has(m.id)).length, 0);
                return (
                  <div key={plan.id} className="border rounded-lg">
                    <button
                      type="button"
                      onClick={() => togglePlan(plan.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-secondary/50"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="font-medium">{plan.name}</span>
                        {planMealCount > 0 && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {planMealCount}
                          </span>
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t p-3 space-y-3">
                        {weekDays.map((day) => {
                          const dayPlan = plan.days.find(d => d.day === day.value);
                          if (!dayPlan || dayPlan.meals.length === 0) return null;
                          return (
                            <div key={day.value}>
                              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                                {day.label}
                              </p>
                              <div className="space-y-1.5 pl-2">
                                {dayPlan.meals.map((meal) => (
                                  <label
                                    key={meal.id}
                                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/50 rounded px-2 py-2 min-h-[44px]"
                                  >
                                    <Checkbox
                                      checked={selectedMealIds.has(meal.id)}
                                      onCheckedChange={() => toggleMeal(meal.id)}
                                    />
                                    <span>{meal.name}</span>
                                    {meal.foods.length > 0 && (
                                      <span className="text-xs text-muted-foreground ml-auto">
                                        {meal.foods.length} {meal.foods.length === 1 ? 'item' : 'itens'}
                                      </span>
                                    )}
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSaveSelection} className="bg-gradient-primary">
              Salvar Seleção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Convite</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Compartilhe esse link. O convite expira em{' '}
              {list.inviteExpiresAt && new Date(list.inviteExpiresAt).toLocaleDateString('pt-BR')}.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 px-3 py-2 text-sm bg-secondary rounded border"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button onClick={copyInvite} variant="outline" size="icon">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="destructive" className="w-full" onClick={handleRevokeInvite}>
              Revogar Convite
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
