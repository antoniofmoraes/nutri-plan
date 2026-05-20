import type { WeekDay } from '@/types';

export const weekDays: { value: WeekDay; label: string; short: string }[] = [
  { value: 'segunda', label: 'Segunda-feira', short: 'Seg' },
  { value: 'terca', label: 'Terça-feira', short: 'Ter' },
  { value: 'quarta', label: 'Quarta-feira', short: 'Qua' },
  { value: 'quinta', label: 'Quinta-feira', short: 'Qui' },
  { value: 'sexta', label: 'Sexta-feira', short: 'Sex' },
  { value: 'sabado', label: 'Sábado', short: 'Sáb' },
  { value: 'domingo', label: 'Domingo', short: 'Dom' },
];
