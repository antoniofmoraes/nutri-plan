import { Plus, Edit, Trash2, X, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { calculateFoodsMacros } from '@/lib/macros';
import type { PresetMeal } from '@/types';

interface PresetCardProps {
  preset: PresetMeal;
  isExpanded: boolean;
  canApply: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddFood: () => void;
  onRemoveFood: (foodId: string) => void;
  onApply: () => void;
}

export function PresetCard({
  preset,
  isExpanded,
  canApply,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddFood,
  onRemoveFood,
  onApply,
}: PresetCardProps) {
  const macros = calculateFoodsMacros(preset.foods);

  return (
    <Card>
      <div className="p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={onToggleExpand}
          >
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-display truncate">{preset.name}</CardTitle>
              {isExpanded
                ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
              <span className="text-accent font-medium">{macros.calories.toFixed(0)} kcal</span>
              <span>P: {macros.protein.toFixed(0)}g</span>
              <span>C: {macros.carbs.toFixed(0)}g</span>
              <span>G: {macros.fat.toFixed(0)}g</span>
              <span>• {preset.foods.length} alimento{preset.foods.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-11 sm:h-9"
              onClick={onApply}
              disabled={preset.foods.length === 0 || !canApply}
              title="Aplicar no plano"
            >
              <Send className="mr-1 h-3 w-3" />
              Aplicar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 sm:h-9 sm:w-9"
              onClick={onEdit}
              aria-label="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 sm:h-9 sm:w-9 hover:text-destructive"
              onClick={onDelete}
              aria-label="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {isExpanded && (
        <CardContent>
          <div className="space-y-2">
            {preset.foods.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nenhum alimento adicionado</p>
            ) : (
              preset.foods.map(({ food, quantity }) => (
                <div key={food.id} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm group">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{food.name}</span>
                    <span className="ml-2 text-muted-foreground">{quantity}g</span>
                    <span className="ml-2 text-xs text-accent">
                      {(food.calories * quantity / 100).toFixed(0)} kcal
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:text-destructive opacity-60 group-hover:opacity-100"
                    onClick={() => onRemoveFood(food.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={onAddFood}
            >
              <Plus className="mr-1 h-3 w-3" />
              Adicionar alimento
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
