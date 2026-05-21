import { ReactNode } from 'react';
import { PortioMark, PortioWordmark } from './PortioLogo';

function AuthSide() {
  return (
    <div className="hidden min-[901px]:flex bg-ink text-bg p-14 flex-col justify-between relative overflow-hidden">
      {/* Decorative numeral */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] overflow-hidden">
        <div
          className="absolute font-mono font-bold text-bg leading-none"
          style={{ fontSize: 480, top: -120, right: -80 }}
        >
          2200
        </div>
      </div>

      <div className="relative flex items-center gap-2.5">
        <PortioMark size={28} />
        <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em" }}>
          PORTIO<span className="text-accent">.</span>
        </span>
      </div>

      <div className="relative max-w-[480px]">
        <div className="eyebrow mb-3.5" style={{ color: "color-mix(in oklab, var(--bg) 60%, transparent)" }}>
          Plano · Refeições · Compras
        </div>
        <h1 className="text-[44px] font-bold tracking-[-0.025em] leading-[1.05]">
          Sua nutrição,<br />
          <span className="text-accent italic font-serif font-normal">
            em proporções exatas.
          </span>
        </h1>
        <p
          className="mt-[18px] text-[15px] leading-[1.55]"
          style={{ color: "color-mix(in oklab, var(--bg) 72%, transparent)" }}
        >
          PORTIO é uma ferramenta de planejamento — sem coach, sem tracker.
          Você desenha seu plano alimentar, monta refeições prontas e gera a lista
          de compras da semana em segundos.
        </p>
      </div>

      <div
        className="relative flex gap-6 font-mono text-[11px] uppercase tracking-[0.08em]"
        style={{ color: "color-mix(in oklab, var(--bg) 60%, transparent)" }}
      >
        <span>01 · Plano</span>
        <span>02 · Macros</span>
        <span>03 · Compras</span>
      </div>
    </div>
  );
}

interface AuthShellProps {
  side: 'left' | 'right';
  children: ReactNode;
}

export function AuthShell({ side, children }: AuthShellProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 min-[901px]:grid-cols-2 bg-bg">
      {side === 'left' && <AuthSide />}
      <div className="p-14 px-6 grid place-items-center">
        <div className="w-full max-w-[380px] flex flex-col gap-[18px]">
          {children}
        </div>
      </div>
      {side === 'right' && <AuthSide />}
    </div>
  );
}
