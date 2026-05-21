import { api, setToken, removeToken } from '@/lib/api';
import { User } from '@/types';

export interface AuthResponse {
  user: User;
  token: string;
}

export type GoogleAuthResult =
  | { status: 'authenticated'; user: User; token: string; email?: never }
  | { status: 'needs_linking'; email: string; user?: never; token?: never };

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export const authService = {
  async login(input: LoginInput): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', input);
    setToken(response.token);
    return response;
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', input);
    setToken(response.token);
    return response;
  },

  async googleAuth(accessToken: string): Promise<GoogleAuthResult> {
    const result = await api.post<GoogleAuthResult>('/api/auth/google', { accessToken });
    if (result.status === 'authenticated') {
      setToken(result.token);
    }
    return result;
  },

  async googleLink(accessToken: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/google/link', { accessToken, password });
    setToken(response.token);
    return response;
  },

  async getMe(): Promise<User> {
    return api.get<User>('/api/auth/me');
  },

  logout(): void {
    removeToken();
  },
};
