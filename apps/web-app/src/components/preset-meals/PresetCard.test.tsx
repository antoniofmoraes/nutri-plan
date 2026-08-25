import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PresetCard } from './PresetCard';
import type { PresetMeal } from '@/types';

const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (msg: string) => toastError(msg) } }));

const preset: PresetMeal = {
  id: 'p1',
  name: 'Café da manhã',
  foods: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

function renderCard(overrides: Partial<Parameters<typeof PresetCard>[0]> = {}) {
  const onRename = overrides.onRename ?? vi.fn().mockResolvedValue(undefined);
  const onToggleExpand = overrides.onToggleExpand ?? vi.fn();
  render(
    <PresetCard
      preset={preset}
      isExpanded={false}
      canApply
      allFoods={[]}
      onToggleExpand={onToggleExpand}
      onRename={onRename}
      onDelete={vi.fn()}
      onAddFood={vi.fn()}
      onRemoveFood={vi.fn()}
      onUpdateFood={vi.fn()}
      onDuplicate={vi.fn()}
      onApply={vi.fn()}
      {...overrides}
    />
  );
  return { onRename, onToggleExpand };
}

const openEditor = () => fireEvent.click(screen.getByRole('button', { name: 'Café da manhã' }));
const nameInput = () => screen.getByLabelText('Nome da refeição pronta');

describe('PresetCard — nome inline', () => {
  beforeEach(() => toastError.mockClear());

  it('salva o nome sem espaços nas extremidades ao pressionar Enter', async () => {
    const { onRename } = renderCard();
    openEditor();
    fireEvent.change(nameInput(), { target: { value: '  Café reforçado  ' } });
    fireEvent.keyDown(nameInput(), { key: 'Enter' });

    await waitFor(() => expect(onRename).toHaveBeenCalledWith('Café reforçado'));
  });

  it('cancela com Escape sem enviar requisição', () => {
    const { onRename } = renderCard();
    openEditor();
    fireEvent.change(nameInput(), { target: { value: 'Outro nome' } });
    fireEvent.keyDown(nameInput(), { key: 'Escape' });

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Café da manhã' })).toBeInTheDocument();
  });

  it('não envia nome vazio e informa a validação', () => {
    const { onRename } = renderCard();
    openEditor();
    fireEvent.change(nameInput(), { target: { value: '   ' } });
    fireEvent.keyDown(nameInput(), { key: 'Enter' });

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Nome obrigatório');
    expect(nameInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it('não envia requisição quando o nome não muda após trim', () => {
    const { onRename } = renderCard();
    openEditor();
    fireEvent.change(nameInput(), { target: { value: 'Café da manhã ' } });
    fireEvent.keyDown(nameInput(), { key: 'Enter' });

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Café da manhã' })).toBeInTheDocument();
  });

  it('restaura o nome anterior e avisa quando a API falha', async () => {
    const onRename = vi.fn().mockRejectedValue(new Error('Falha ao salvar'));
    renderCard({ onRename });
    openEditor();
    fireEvent.change(nameInput(), { target: { value: 'Café reforçado' } });
    fireEvent.keyDown(nameInput(), { key: 'Enter' });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Café da manhã' })).toBeInTheDocument()
    );
    expect(toastError).toHaveBeenCalledWith('Falha ao salvar');
  });

  it('envia apenas uma requisição quando Enter e blur disparam juntos', async () => {
    const { onRename } = renderCard();
    openEditor();
    fireEvent.change(nameInput(), { target: { value: 'Café reforçado' } });
    fireEvent.keyDown(nameInput(), { key: 'Enter' });
    fireEvent.blur(nameInput());

    await waitFor(() => expect(onRename).toHaveBeenCalledTimes(1));
  });

  it('clicar no nome edita em vez de expandir o card', () => {
    const { onToggleExpand } = renderCard();
    openEditor();

    expect(onToggleExpand).not.toHaveBeenCalled();
    expect(nameInput()).toBeInTheDocument();
  });
});
