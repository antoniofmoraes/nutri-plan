import { useState, useEffect } from 'react';
import { Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Editar Refeições</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Refeições aparecem em todos os dias da semana
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border bg-secondary/30 p-3 space-y-2">
            <Label className="text-xs">Nova refeição</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome (ex: Café da manhã)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
              <Input
                placeholder="Hora"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-24"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
              <Button onClick={handleAdd} disabled={!newName.trim() || adding} className="bg-gradient-primary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {slots.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
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
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
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
    <div className="flex items-center gap-1 rounded-lg border p-1.5">
      <div className="flex flex-col">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          disabled={isFirst}
          onClick={() => onMove(slot.id, -1)}
          title="Mover para cima"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          disabled={isLast}
          onClick={() => onMove(slot.id, 1)}
          title="Mover para baixo"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitChanges}
        className="h-8 flex-1"
        placeholder="Nome"
      />
      <Input
        value={time}
        onChange={(e) => setTime(e.target.value)}
        onBlur={commitChanges}
        className="h-8 w-20"
        placeholder="Hora"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:text-destructive"
        onClick={() => onDelete(slot.id)}
        title="Apagar"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
