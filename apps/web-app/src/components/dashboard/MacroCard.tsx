import { Flame, Zap, Wheat, Droplet, type LucideIcon } from 'lucide-react';

interface MacroSlot {
  key: string;
  label: string;
  value: number;
  target: number;
  color: string;
  unit: string;
  icon: LucideIcon;
}

export function macroSlots(
  totals: { cal: number; p: number; c: number; f: number },
  target: { cal: number; p: number; c: number; f: number },
): MacroSlot[] {
  return [
    { key: "cal", label: "Calorias", value: totals.cal, target: target.cal, color: "var(--m-cal)", unit: "kcal", icon: Flame },
    { key: "p", label: "Proteína", value: totals.p, target: target.p, color: "var(--m-pro)", unit: "g", icon: Zap },
    { key: "c", label: "Carbo.", value: totals.c, target: target.c, color: "var(--m-carb)", unit: "g", icon: Wheat },
    { key: "f", label: "Gordura", value: totals.f, target: target.f, color: "var(--m-fat)", unit: "g", icon: Droplet },
  ];
}

export function MacroCard({ s }: { s: MacroSlot }) {
  const pct = Math.min(100, Math.round((s.value / s.target) * 100));
  const diff = s.target - s.value;
  const Icon = s.icon;

  return (
    <div className="bg-surface border border-line rounded-lg shadow-1 p-4 relative overflow-hidden">
      <div className="flex justify-between items-start mb-3.5">
        <div>
          <div className="eyebrow mb-1.5">{s.label}</div>
          <div className="num text-[22px] font-semibold tracking-[-0.01em] leading-none">
            {Math.round(s.value).toLocaleString("pt-BR")}
            <span className="text-muted text-[13px] ml-1">
              / {s.target.toLocaleString("pt-BR")} {s.unit}
            </span>
          </div>
        </div>
        <div
          className="w-[30px] h-[30px] rounded-lg grid place-items-center flex-shrink-0"
          style={{
            background: `color-mix(in oklab, ${s.color} 14%, transparent)`,
            color: s.color,
          }}
        >
          <Icon size={16} strokeWidth={1.6} />
        </div>
      </div>
      <div className="h-1 bg-surface-alt rounded-full overflow-hidden mb-1.5">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%`, background: s.color }}
        />
      </div>
      <div className="mono text-[10.5px] text-muted flex justify-between">
        <span>{pct}%</span>
        <span>{diff > 0 ? "−" : "+"}{Math.abs(Math.round(diff))}</span>
      </div>
    </div>
  );
}

export function MacroCards({
  totals,
  target,
}: {
  totals: { cal: number; p: number; c: number; f: number };
  target: { cal: number; p: number; c: number; f: number };
}) {
  const slots = macroSlots(totals, target);
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
      {slots.map((s) => (
        <MacroCard key={s.key} s={s} />
      ))}
    </div>
  );
}
