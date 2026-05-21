interface MacroRingProps {
  totals: { cal: number; p: number; c: number; f: number };
  target: { cal: number; p: number; c: number; f: number };
  size?: number;
}

export function MacroRing({ totals, target, size = 220 }: MacroRingProps) {
  const tw = 18;
  const r = (size - 28) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  const kcalP = totals.p * 4;
  const kcalC = totals.c * 4;
  const kcalF = totals.f * 9;
  const totalKcal = Math.max(1, kcalP + kcalC + kcalF);

  const segs = [
    { key: "p", color: "var(--m-pro)", share: kcalP / totalKcal, value: totals.p, label: "Proteína", target: target.p },
    { key: "c", color: "var(--m-carb)", share: kcalC / totalKcal, value: totals.c, label: "Carbo.", target: target.c },
    { key: "f", color: "var(--m-fat)", share: kcalF / totalKcal, value: totals.f, label: "Gordura", target: target.f },
  ];

  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-[18px]">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-alt)" strokeWidth={tw} />
          {segs.map((s) => {
            const len = s.share * circ;
            const dash = `${len} ${circ - len}`;
            const off = -offset;
            offset += len;
            return (
              <circle
                key={s.key}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={tw}
                strokeDasharray={dash}
                strokeDashoffset={off}
                strokeLinecap="butt"
                className="transition-all duration-[350ms]"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="eyebrow mb-1">Calorias</div>
            <div className="num text-[30px] font-semibold tracking-[-0.02em] leading-none">
              {Math.round(totals.cal).toLocaleString("pt-BR")}
            </div>
            <div className="mono text-[11px] text-muted mt-1">
              de {target.cal.toLocaleString("pt-BR")} kcal
            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col gap-2">
        {segs.map((s) => {
          const pct = Math.round(s.share * 100);
          return (
            <div key={s.key} className="flex items-center gap-2.5 text-[13px]">
              <span className="w-2 h-2 rounded-[2px] flex-shrink-0" style={{ background: s.color }} />
              <span className="flex-1 text-ink-2">{s.label}</span>
              <span className="num text-muted">{Math.round(s.value)}g</span>
              <span className="num text-muted w-9 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
