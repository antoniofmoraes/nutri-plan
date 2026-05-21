import { useState, useEffect } from 'react';
import { Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { MealSlot } from '@/types';

interface SlotsManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slots: MealSlot[];
  onAdd: (input: { name: string; time?: string }) => Promise<void>;
  onUpdate: (slotId: string, updates: { name?: string; time?: string }) => Promise<void>;
  onDelete: (slotId: string) => void;
  onMove: (slotId: string, direction: -1 | 1) => Promise<void>;
}

export function SlotsManagerDialog({ open, onOpenChange, slots, onAdd, onUpdate, onDelete, onMove }: SlotsManagerDialogProps) {
  const [newName, setNewName] = useState('');
  const [newTime, setNewTime] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim() || adding) return;
    setAdding(true);
    try {
      await onAdd({ name: newName.trim(), time: newTime || undefined });
      setNewName('');
      setNewTime('');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar refeições</DialogTitle>
          <DialogDescription>
            Refeições aparecem em todos os dias da semana.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="rounded-[var(--r-md)] border border-line bg-surface-alt/50 p-3 space-y-2">
            <label className="label-mono">Nova refeição</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Nome (ex: Café da manhã)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Hora"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="flex-1 sm:w-24 sm:flex-none"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                />
                <Button
                  variant="acc"
                  size="icon"
                  onClick={handleAdd}
                  disabled={!newName.trim() || adding}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          </div>

          {slots.length === 0 ? (
            <p className="text-center text-[13px] text-muted py-6">
              Nenhuma refeição ainda. Adicione acima.
            </p>
          ) : (
            <div className="space-y-1.5">
              {slots.map((slot, idx) => (
                <SlotEditRow
                  key={slot.id}
                  slot={slot}
                  isFirst={idx === 0}
                  isLast={idx === slots.length - 1}
                  onMove={onMove}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SlotEditRowProps {
  slot: MealSlot;
  isFirst: boolean;
  isLast: boolean;
  onMove: (slotId: string, direction: -1 | 1) => Promise<void>;
  onUpdate: (slotId: string, updates: { name?: string; time?: string }) => Promise<void>;
  onDelete: (slotId: string) => void;
}

function SlotEditRow({ slot, isFirst, isLast, onMove, onUpdate, onDelete }: SlotEditRowProps) {
  const [name, setName] = useState(slot.name);
  const [time, setTime] = useState(slot.time || '');

  useEffect(() => {
    setName(slot.name);
    setTime(slot.time || '');
  }, [slot.id, slot.name, slot.time]);

  const commitChanges = () => {
    const updates: { name?: string; time?: string } = {};
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== slot.name) updates.name = trimmedName;
    const normalizedTime = time.trim();
    if (normalizedTime !== (slot.time || '')) updates.time = normalizedTime;
    if (Object.keys(updates).length > 0) onUpdate(slot.id, updates);
  };

  return (
    <div className="flex flex-col gap-2 rounded-[var(--r-md)] border border-line p-2 sm:flex-row sm:items-center sm:gap-1.5 sm:p-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitChanges}
        className="h-9 sm:h-8 sm:flex-1 text-[13px]"
        placeholder="Nome"
      />
      <div className="flex items-center gap-1.5">
        <Input
          value={time}
          onChange={(e) => setTime(e.target.value)}
          onBlur={commitChanges}
          className="h-9 w-24 sm:h-8 sm:w-20 text-[13px]"
          placeholder="Hora"
        />
        <div className="flex flex-col">
          <button
            className="h-[18px] w-7 grid place-items-center text-muted hover:text-ink disabled:opacity-30 transition-colors duration-[120ms]"
            disabled={isFirst}
            onClick={() => onMove(slot.id, -1)}
          >
            <ChevronUp size={13} />
          </button>
          <button
            className="h-[18px] w-7 grid place-items-center text-muted hover:text-ink disabled:opacity-30 transition-colors duration-[120ms]"
            disabled={isLast}
            onClick={() => onMove(slot.id, 1)}
          >
            <ChevronDown size={13} />
          </button>
        </div>
        <button
          className="w-[30px] h-[30px] sm:w-[26px] sm:h-[26px] rounded-sm grid place-items-center text-muted hover:bg-surface-alt hover:text-danger transition-[background,color] duration-[120ms] ml-auto"
          onClick={() => onDelete(slot.id)}
        >
          <Trash2 size={14} strokeWidth={1.6} />
        </button>
      </div>
    </div>
  );
}
