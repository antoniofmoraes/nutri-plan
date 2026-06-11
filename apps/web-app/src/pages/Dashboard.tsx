import { useEffect, useMemo, useState } from 'react';
import { Plus, CalendarRange } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMealPlans } from '@/hooks/useMealPlans';
import { calculateDayMacros, calculateMealMacros } from '@/lib/macros';
import { MacroCards } from '@/components/dashboard/MacroCard';
import { DashboardMealCard } from '@/components/dashboard/MealCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { MacroRing } from '@/components/ui/macro-ring';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeekDay } from '@/types';
import { weekDays } from '@/lib/constants';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

function getTodayWeekDay(): WeekDay {
  const dayIndex = new Date().getDay();
  const map: WeekDay[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return map[dayIndex];
}

function getTodayIndex(): number {
  const today = getTodayWeekDay();
  return weekDays.findIndex(d => d.value === today);
}

export default function Dashboard() {
  const { user } = useAuth();
  const { mealPlans, isLoading } = useMealPlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  useEffect(() => {
    if (mealPlans.length > 0 && !selectedPlanId) {
      const main = mealPlans.find(p => p.isMain);
      setSelectedPlanId(main?.id ?? mealPlans[0].id);
    }
  }, [mealPlans, selectedPlanId]);

  const [selectedDay, setSelectedDay] = useState<WeekDay>(getTodayWeekDay());

  const selectedPlan = mealPlans.find(p => p.id === selectedPlanId);
  const dayPlan = selectedPlan?.days.find(d => d.day === selectedDay);
  const todayIdx = getTodayIndex();

  const dayMacros = useMemo(() => {
    if (!dayPlan) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return calculateDayMacros(dayPlan, selectedPlan);
  }, [dayPlan, selectedPlan]);

  const totals = { cal: dayMacros.calories, p: dayMacros.protein, c: dayMacros.carbs, f: dayMacros.fat };
  const target = {
    cal: selectedPlan?.dailyCalories || 2000,
    p: selectedPlan?.dailyProtein || 150,
    c: selectedPlan?.dailyCarbs || 250,
    f: selectedPlan?.dailyFat || 70,
  };

  const selectedDayShort = weekDays.find(d => d.value === selectedDay)?.short || '';

  const foodCount = dayPlan?.meals.filter(m => !m.isCheat).reduce((a, m) => a + m.foods.length, 0) ?? 0;

  if (isLoading) {
    return <LoadingState label="Carregando planos…" />;
  }

  if (mealPlans.length === 0) {
    return (
      <EmptyState
        icon={CalendarRange}
        title="Nenhum plano alimentar"
        description="Crie seu primeiro plano para começar a planejar suas refeições da semana."
        action={
          <Button variant="acc" asChild>
            <Link to="/planos">
              <Plus size={16} />
              Criar primeiro plano
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-2">
            {weekDays[todayIdx]?.short} · {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
          </div>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] leading-[1.1]">
            Olá, {user?.name?.split(' ')[0] || 'Usuário'}.
            <span className="block text-muted font-medium text-[18px] mt-1.5 tracking-normal">
              Aqui está sua semana.
            </span>
          </h1>
        </div>
        {mealPlans.length > 0 && (
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger className="w-[200px] bg-surface border-line rounded-[var(--r-md)] h-10 text-[13.5px] font-medium">
              <SelectValue placeholder="Selecione um plano" />
            </SelectTrigger>
            <SelectContent>
              {mealPlans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Day tabs */}
      <DayTabs value={selectedDay} onChange={setSelectedDay} />

      {/* Macros section */}
      <div className="bg-surface border border-line rounded-lg shadow-1 overflow-hidden">
        <div className="flex items-center justify-between px-[22px] py-4 border-b border-line gap-2.5 flex-wrap">
          <div>
            <div className="eyebrow mb-1">Macros · {selectedDayShort}</div>
            <div className="font-semibold text-[15px]">
              Meta diária{' '}
              <span className="mono text-muted text-xs font-medium">
                · {target.cal.toLocaleString("pt-BR")} kcal
              </span>
            </div>
          </div>
        </div>
        <div className="p-[22px]">
          <div className="grid grid-cols-1 min-[780px]:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center">
              <MacroRing totals={totals} target={target} size={240} />
            </div>
            <MacroCards totals={totals} target={target} />
          </div>
        </div>
      </div>

      {/* Meals section */}
      <div>
        <div className="flex items-center justify-between mb-3.5 gap-3 flex-wrap">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
              Refeições de {selectedDayShort?.toLowerCase()}
            </h2>
            <p className="text-muted text-[13px] mt-1">
              {dayPlan?.meals.length || 0} refeições · {foodCount} alimentos
            </p>
          </div>
          {selectedPlan && (
            <Button variant="sec" size="sm" asChild>
              <Link to={`/planos/${selectedPlan.id}`}>
                Editar
              </Link>
            </Button>
          )}
        </div>

        {!dayPlan || dayPlan.meals.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="Nenhuma refeição"
            description="Adicione refeições a este dia no seu plano alimentar."
            action={selectedPlan && (
              <Button variant="acc" asChild>
                <Link to={`/planos/${selectedPlan.id}`}>Editar plano</Link>
              </Button>
            )}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {dayPlan.meals.map(meal => (
              <DashboardMealCard
                key={meal.id}
                meal={meal}
                macros={calculateMealMacros(meal, selectedPlan)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DayTabs({ value, onChange }: { value: WeekDay; onChange: (v: WeekDay) => void }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {weekDays.map((day, i) => {
        const isActive = value === day.value;
        return (
          <button
            key={day.value}
            onClick={() => onChange(day.value)}
            className={cn(
              'border rounded-[var(--r-md)] py-2.5 px-2 text-center transition-[background,border-color,color] duration-120 cursor-pointer',
              isActive
                ? 'bg-ink text-bg border-ink'
                : 'bg-surface border-line hover:bg-surface-alt'
            )}
          >
            <span className="text-[13px] font-medium hidden min-[640px]:block">{day.short}</span>
            <span className="text-[13px] font-medium min-[640px]:hidden">{day.letter}</span>
            <span
              className={cn(
                'block font-mono text-[11px] mt-0.5 hidden min-[640px]:block',
                isActive ? 'opacity-70' : 'text-muted'
              )}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
