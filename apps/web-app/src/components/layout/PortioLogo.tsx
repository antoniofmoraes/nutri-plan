interface PortioLogoProps {
  size?: number;
}

export function PortioMark({ size = 26 }: PortioLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.5 V 12 L 21 9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function PortioWordmark({ className }: { className?: string }) {
  return (
    <span
      className={className}
      style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}
    >
      PORTIO<span style={{ color: "var(--accent)" }}>.</span>
    </span>
  );
}
