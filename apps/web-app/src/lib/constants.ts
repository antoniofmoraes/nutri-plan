import type { WeekDay } from '@/types';

export const weekDays: { value: WeekDay; label: string; short: string; letter: string }[] = [
  { value: 'segunda', label: 'Segunda-feira', short: 'Seg', letter: 'S' },
  { value: 'terca', label: 'Terça-feira', short: 'Ter', letter: 'T' },
  { value: 'quarta', label: 'Quarta-feira', short: 'Qua', letter: 'Q' },
  { value: 'quinta', label: 'Quinta-feira', short: 'Qui', letter: 'Q' },
  { value: 'sexta', label: 'Sexta-feira', short: 'Sex', letter: 'S' },
  { value: 'sabado', label: 'Sábado', short: 'Sáb', letter: 'S' },
  { value: 'domingo', label: 'Domingo', short: 'Dom', letter: 'D' },
];
