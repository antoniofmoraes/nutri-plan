import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="bg-surface border border-line rounded-lg shadow-1 p-12 flex flex-col items-center text-center max-w-[420px]">
        <div className="num text-[72px] font-bold leading-none mb-4 text-muted">
          404
        </div>
        <h1 className="text-[19px] font-semibold mb-1.5">Página não encontrada</h1>
        <p className="text-muted max-w-[320px] mb-5 text-sm">
          O endereço que você acessou não existe ou foi removido.
        </p>
        <Button variant="acc" asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
