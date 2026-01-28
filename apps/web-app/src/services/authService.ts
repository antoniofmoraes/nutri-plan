import { api, setToken, removeToken } from '@/lib/api';
import { User } from '@/types';

interface AuthResponse {
  user: User;
  token: string;
}

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

  async getMe(): Promise<User> {
    return api.get<User>('/api/auth/me');
  },

  logout(): void {
    removeToken();
  },
};
