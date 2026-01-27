// WeekDay and PlanGoal types - defined inline to avoid Prisma import issues
export type WeekDay = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';
export type PlanGoal = 'emagrecer' | 'manter' | 'ganhar';

export const WeekDay = {
  segunda: 'segunda',
  terca: 'terca',
  quarta: 'quarta',
  quinta: 'quinta',
  sexta: 'sexta',
  sabado: 'sabado',
  domingo: 'domingo',
} as const;

export const PlanGoal = {
  emagrecer: 'emagrecer',
  manter: 'manter',
  ganhar: 'ganhar',
} as const;

// User types
export interface UserPayload {
  id: string;
  email: string;
  name: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Macro calculation
export interface MacroSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Context variables for Hono
export interface Variables {
  userId: string;
  userEmail: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
