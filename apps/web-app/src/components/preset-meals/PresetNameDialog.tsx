import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface PresetNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (name: string) => void;
  isEditing: boolean;
  onSubmit: () => void;
}

export function PresetNameDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  isEditing,
  onSubmit,
}: PresetNameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Renomear refeição pronta' : 'Nova refeição pronta'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Altere o nome da refeição.' : 'Dê um nome para a refeição.'}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div>
            <label className="label-mono">Nome</label>
            <Input
              placeholder="Ex: Almoço frango com arroz"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </DialogClose>
          <Button variant="acc" onClick={onSubmit} disabled={!name.trim()}>
            {isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
