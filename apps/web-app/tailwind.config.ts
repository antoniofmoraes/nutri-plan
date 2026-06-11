import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1152px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
        serif: ['var(--font-serif)'],
      },
      colors: {
        bg: "var(--bg)",
        paper: "var(--paper)",
        surface: {
          DEFAULT: "var(--surface)",
          alt: "var(--surface-alt)",
          "2": "var(--surface-2)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          "2": "var(--ink-2)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          "2": "var(--muted-2)",
        },
        line: {
          DEFAULT: "var(--line)",
          "2": "var(--line-2)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          ink: "var(--accent-ink)",
          soft: "var(--accent-soft)",
        },
        good: "var(--good)",
        warn: "var(--warn)",
        danger: "var(--danger)",

        // Macro data-viz colors
        "m-cal": "var(--m-cal)",
        "m-pro": "var(--m-pro)",
        "m-carb": "var(--m-carb)",
        "m-fat": "var(--m-fat)",
        "m-fib": "var(--m-fib)",

        // shadcn compat
        border: "var(--line)",
        input: "var(--line)",
        ring: "var(--ink)",
        background: "var(--bg)",
        foreground: "var(--ink)",
        primary: {
          DEFAULT: "var(--ink)",
          foreground: "var(--bg)",
        },
        secondary: {
          DEFAULT: "var(--surface)",
          foreground: "var(--ink)",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "var(--paper)",
          foreground: "var(--ink)",
        },
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--ink)",
        },
        sidebar: {
          DEFAULT: "var(--paper)",
          foreground: "var(--ink-2)",
          border: "var(--line)",
          accent: "var(--surface-alt)",
          "accent-foreground": "var(--ink)",
        },
      },
      borderRadius: {
        sm: "var(--r-sm)",
        DEFAULT: "var(--r-md)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
      },
      boxShadow: {
        "1": "var(--shadow-1)",
        "2": "var(--shadow-2)",
        "3": "var(--shadow-3)",
      },
      transitionDuration: {
        "120": "120ms",
        "350": "350ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "scale(.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.15s cubic-bezier(.3,.7,.4,1)",
        "slide-in": "slide-in 0.18s cubic-bezier(.3,.7,.4,1)",
        "toast-in": "toast-in 0.18s cubic-bezier(.3,.7,.4,1)",
        spin: "spin 0.8s linear infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
