import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { ApplyPresetDialog } from './ApplyPresetDialog';
import type { Food, MealPlan, PresetMeal, WeekDay } from '@/types';

const days: WeekDay[] = ['segunda', 'terca'];
const slots = [
  { id: 's1', name: 'Café da manhã', sortOrder: 0 },
  { id: 's2', name: 'Almoço', sortOrder: 1 },
];

const frango = { id: 'f1', name: 'Frango', portion: '100g', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 } as Food;

function makePlan(id: string, name: string, isMain: boolean): MealPlan {
  return {
    id, name, goal: 'manter', dailyCalories: 2000, isMain, role: 'owner', canEdit: true, slots,
    days: days.map((day) => ({
      day,
      meals: slots.map((s) => ({
        id: `${id}-${day}-${s.id}`,
        slotId: s.id,
        name: s.name,
        // segunda/almoço tem alimentos; terça/almoço é livre; o resto vazio
        isCheat: day === 'terca' && s.id === 's2',
        foods: day === 'segunda' && s.id === 's2' ? [{ id: 'mf1', food: frango, quantity: 150 }] : [],
      })),
    })),
    createdAt: new Date(), updatedAt: new Date(),
  } as unknown as MealPlan;
}

const preset: PresetMeal = {
  id: 'p1', name: 'Café reforçado',
  foods: [{ food: frango, quantity: 120 }],
  createdAt: new Date(), updatedAt: new Date(),
};

function Harness({ onApply, plans }: { onApply: (p: string, m: string[]) => Promise<void>; plans: MealPlan[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>abrir</button>
      <ApplyPresetDialog
        open={open}
        onOpenChange={setOpen}
        preset={preset}
        mealPlans={plans}
        onApply={onApply}
      />
    </>
  );
}

const openDialog = () => fireEvent.click(screen.getByText('abrir'));
const primary = () => screen.getByRole('button', { name: /^Aplicar/ });
// mobile e desktop renderizam juntos no jsdom (CSS não esconde), então pega a primeira.
const meal = (name: string) => screen.getAllByRole('checkbox', { name })[0];

describe('ApplyPresetDialog', () => {
  it('parte de estado limpo a cada abertura', async () => {
    const onApply = vi.fn().mockResolvedValue(undefined);
    render(<Harness onApply={onApply} plans={[makePlan('a', 'Plano principal', true)]} />);

    openDialog();
    // marca tudo pelo "Selecionar tudo"
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    await waitFor(() => expect(primary()).toHaveTextContent(/Aplicar em/));

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    openDialog();
    await waitFor(() => expect(primary()).toBeDisabled());
    expect(primary()).toHaveTextContent('Aplicar');
  });

  it('usa o plano principal como padrão', async () => {
    render(
      <Harness
        onApply={vi.fn()}
        plans={[makePlan('a', 'Plano secundário', false), makePlan('b', 'Plano principal', true)]}
      />
    );
    openDialog();
    await waitFor(() =>
      expect(screen.getByRole('combobox')).toHaveTextContent('Plano principal')
    );
  });

  it('bloqueia enquanto houver refeição livre selecionada', async () => {
    render(<Harness onApply={vi.fn()} plans={[makePlan('a', 'Plano', true)]} />);
    openDialog();
    fireEvent.click(screen.getAllByRole('checkbox')[0]);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Refeição livre/));
    expect(primary()).toBeDisabled();
  });

  it('aplica direto quando só há refeições vazias', async () => {
    const onApply = vi.fn().mockResolvedValue(undefined);
    render(<Harness onApply={onApply} plans={[makePlan('a', 'Plano', true)]} />);
    openDialog();

    fireEvent.click(meal('Café da manhã · Seg'));
    await waitFor(() => expect(primary()).toBeEnabled());
    fireEvent.click(primary());

    await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Substituir alimentos existentes?')).not.toBeInTheDocument();
  });

  it('mantém o diálogo aberto e a seleção quando a aplicação falha', async () => {
    const onApply = vi.fn().mockRejectedValue(new Error('falhou'));
    render(<Harness onApply={onApply} plans={[makePlan('a', 'Plano', true)]} />);
    openDialog();

    fireEvent.click(meal('Café da manhã · Seg'));
    await waitFor(() => expect(primary()).toBeEnabled());
    const label = primary().textContent;
    fireEvent.click(primary());

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/Não foi possível aplicar/)
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(primary().textContent).toBe(label);
  });
  it('exige confirmação nomeando preset, plano e refeições ao sobrescrever', async () => {
    const onApply = vi.fn().mockResolvedValue(undefined);
    render(<Harness onApply={onApply} plans={[makePlan('a', 'Plano principal', true)]} />);
    openDialog();

    // almoço de segunda é a única refeição com alimentos
    fireEvent.click(meal('Almoço · Seg'));
    await waitFor(() => expect(primary()).toBeEnabled());
    fireEvent.click(primary());

    await waitFor(() =>
      expect(screen.getByText('Substituir alimentos existentes?')).toBeInTheDocument()
    );
    // nomeia origem e destino, e lista a refeição afetada
    expect(screen.getByText(/Café reforçado/)).toBeInTheDocument();
    expect(screen.getByText(/Plano principal/)).toBeInTheDocument();
    expect(screen.getByText(/Almoço · Seg/)).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();

    // voltar preserva a seleção
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    await waitFor(() => expect(primary()).toHaveTextContent(/Aplicar em/));

    fireEvent.click(primary());
    await waitFor(() => screen.getByRole('button', { name: 'Substituir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Substituir' }));
    await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1));
  });
});
