import { useMemo, useState } from 'react';
import { Flame, Beef, Wheat, Droplets, Plus } from 'lucide-react';
import { useMealPlan } from '@/contexts/MealPlanContext';
import { useAuth } from '@/contexts/AuthContext';
import { MacroCard } from '@/components/dashboard/MacroCard';
import { MealCard } from '@/components/dashboard/MealCard';
import { MacroRing } from '@/components/ui/macro-ring';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeekDay } from '@/types';
import { Link } from 'react-router-dom';

const weekDays: { value: WeekDay; label: string; short: string }[] = [
  { value: 'segunda', label: 'Segunda-feira', short: 'Seg' },
  { value: 'terca', label: 'Terça-feira', short: 'Ter' },
  { value: 'quarta', label: 'Quarta-feira', short: 'Qua' },
  { value: 'quinta', label: 'Quinta-feira', short: 'Qui' },
  { value: 'sexta', label: 'Sexta-feira', short: 'Sex' },
  { value: 'sabado', label: 'Sábado', short: 'Sáb' },
  { value: 'domingo', label: 'Domingo', short: 'Dom' },
];

function getTodayWeekDay(): WeekDay {
  const dayIndex = new Date().getDay();
  const map: WeekDay[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return map[dayIndex];
}

export default function Dashboard() {
  const { user } = useAuth();
  const { mealPlans, calculateDayMacros, calculateMealMacros } = useMealPlan();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(mealPlans[0]?.id || '');
  const [selectedDay, setSelectedDay] = useState<WeekDay>(getTodayWeekDay());

  const selectedPlan = mealPlans.find(p => p.id === selectedPlanId);
  const dayPlan = selectedPlan?.days.find(d => d.day === selectedDay);

  const dayMacros = useMemo(() => {
    if (!dayPlan) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return calculateDayMacros(dayPlan);
  }, [dayPlan, calculateDayMacros]);

  const todayLabel = weekDays.find(d => d.value === selectedDay)?.label || '';

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">
            Olá, {user?.name?.split(' ')[0] || 'Usuário'}! 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            {todayLabel} • Acompanhe seu plano alimentar
          </p>
        </div>
        
        {mealPlans.length > 0 && (
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger className="w-full sm:w-[200px]">
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

      {mealPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-card p-12 shadow-medium">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground font-display">
            Nenhum plano alimentar
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Crie seu primeiro plano alimentar para começar a acompanhar sua dieta.
          </p>
          <Button asChild className="mt-6 bg-gradient-primary hover:opacity-90 transition-opacity">
            <Link to="/planos">
              <Plus className="mr-2 h-4 w-4" />
              Criar Plano
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Macro Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MacroCard
              label="Calorias"
              value={dayMacros.calories}
              unit="kcal"
              color="calories"
              icon={<Flame className="h-6 w-6 text-accent" />}
            />
            <MacroCard
              label="Proteína"
              value={dayMacros.protein}
              unit="g"
              color="protein"
              icon={<Beef className="h-6 w-6 text-protein" />}
            />
            <MacroCard
              label="Carboidratos"
              value={dayMacros.carbs}
              unit="g"
              color="carbs"
              icon={<Wheat className="h-6 w-6 text-carbs" />}
            />
            <MacroCard
              label="Gorduras"
              value={dayMacros.fat}
              unit="g"
              color="fat"
              icon={<Droplets className="h-6 w-6 text-fat" />}
            />
          </div>

          {/* Day Tabs */}
          <Tabs value={selectedDay} onValueChange={(v) => setSelectedDay(v as WeekDay)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7 bg-muted p-1">
              {weekDays.map(day => (
                <TabsTrigger
                  key={day.value}
                  value={day.value}
                  className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="hidden sm:inline">{day.short}</span>
                  <span className="sm:hidden">{day.short.slice(0, 1)}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {weekDays.map(day => (
              <TabsContent key={day.value} value={day.value} className="mt-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Meals List */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground font-display">
                        Refeições de {day.label}
                      </h3>
                    </div>
                    
                    {dayPlan?.meals.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-muted p-8 text-center">
                        <p className="text-muted-foreground">
                          Nenhuma refeição cadastrada para este dia.
                        </p>
                        <Button asChild variant="outline" className="mt-4">
                          <Link to="/planos">Gerenciar Plano</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dayPlan?.meals.map(meal => (
                          <MealCard
                            key={meal.id}
                            meal={meal}
                            macros={calculateMealMacros(meal)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Macro Ring Summary */}
                  <div className="rounded-2xl bg-card p-6 shadow-medium">
                    <h3 className="text-lg font-semibold text-foreground font-display mb-4">
                      Distribuição de Macros
                    </h3>
                    <div className="flex flex-col items-center">
                      <MacroRing
                        protein={dayMacros.protein}
                        carbs={dayMacros.carbs}
                        fat={dayMacros.fat}
                        size={140}
                      />
                      <div className="mt-6 grid w-full grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="mx-auto mb-1 h-3 w-3 rounded-full bg-protein" />
                          <p className="text-xs text-muted-foreground">Proteína</p>
                          <p className="font-semibold text-foreground">{dayMacros.protein.toFixed(0)}g</p>
                        </div>
                        <div>
                          <div className="mx-auto mb-1 h-3 w-3 rounded-full bg-carbs" />
                          <p className="text-xs text-muted-foreground">Carbos</p>
                          <p className="font-semibold text-foreground">{dayMacros.carbs.toFixed(0)}g</p>
                        </div>
                        <div>
                          <div className="mx-auto mb-1 h-3 w-3 rounded-full bg-fat" />
                          <p className="text-xs text-muted-foreground">Gordura</p>
                          <p className="font-semibold text-foreground">{dayMacros.fat.toFixed(0)}g</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
}
