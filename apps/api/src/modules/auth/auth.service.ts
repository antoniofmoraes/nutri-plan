import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository.js';
import { RegisterInput, LoginInput, AuthResponse } from '../../dtos/auth.dto.js';
import { JWTPayload } from '../../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await authRepository.findUserByEmail(input.email);
    
    if (existingUser) {
      const error = new Error('Email já cadastrado') as any;
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = await authRepository.createUser({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    });

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await authRepository.findUserByEmail(input.email);

    if (!user) {
      const error = new Error('Credenciais inválidas') as any;
      error.statusCode = 401;
      throw error;
    }

    const isValidPassword = await bcrypt.compare(input.password, user.password);

    if (!isValidPassword) {
      const error = new Error('Credenciais inválidas') as any;
      error.statusCode = 401;
      throw error;
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    };
  }

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      const error = new Error('Usuário não encontrado') as any;
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  private generateToken(userId: string, email: string): string {
    const payload: JWTPayload = { userId, email };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }
}

export const authService = new AuthService();
