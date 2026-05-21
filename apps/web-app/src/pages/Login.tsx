import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AuthShell } from '@/components/layout/AuthShell';
import { PortioMark, PortioWordmark } from '@/components/layout/PortioLogo';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Bem-vindo de volta!');
        navigate('/');
      }
    } catch {
      // error captured by AuthContext
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  return (
    <AuthShell side="right">
      <div>
        <div className="flex items-center gap-2.5 mb-9">
          <PortioMark size={28} />
          <PortioWordmark />
        </div>
        <div className="eyebrow mb-2">Acessar</div>
        <h1 className="text-[30px] font-bold tracking-[-0.02em] leading-[1.1]">
          Bem-vindo de volta.
        </h1>
        <p className="text-muted mt-2">
          Entre na sua conta para continuar planejando.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <label className="label-mono">Email</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted flex items-center">
              <Mail size={16} strokeWidth={1.6} />
            </span>
            <Input
              type="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-[38px]"
              required
            />
          </div>
        </div>

        <div>
          <label className="label-mono">Senha</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted flex items-center">
              <Lock size={16} strokeWidth={1.6} />
            </span>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-[38px]"
              required
              minLength={6}
            />
          </div>
        </div>

        <Button
          variant="acc"
          type="submit"
          disabled={loading}
          className="h-11 text-sm mt-1.5 w-full"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Entrando…
            </>
          ) : (
            <>
              Entrar
              <ArrowRight size={15} />
            </>
          )}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-muted text-xs">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleLoginButton />

      <div className="text-center text-muted text-[13px] mt-1">
        Não tem conta?{' '}
        <Link to="/cadastro" className="text-ink font-medium hover:underline">
          Cadastre-se
        </Link>
      </div>
    </AuthShell>
  );
}
