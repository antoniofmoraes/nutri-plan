import { userRepository } from './user.repository.js';
import { UpdateUserInput } from '../../dtos/user.dto.js';

export class UserService {
  async getUser(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      const error = new Error('Usuário não encontrado') as any;
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  async updateUser(userId: string, input: UpdateUserInput) {
    const user = await userRepository.findById(userId);

    if (!user) {
      const error = new Error('Usuário não encontrado') as any;
      error.statusCode = 404;
      throw error;
    }

    // Check if email is being changed and if it's already taken
    if (input.email && input.email !== user.email) {
      const existingUser = await userRepository.findByEmail(input.email);
      if (existingUser) {
        const error = new Error('Email já está em uso') as any;
        error.statusCode = 409;
        throw error;
      }
    }

    return userRepository.update(userId, input);
  }

  async deleteUser(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      const error = new Error('Usuário não encontrado') as any;
      error.statusCode = 404;
      throw error;
    }

    await userRepository.delete(userId);
    return { message: 'Usuário excluído com sucesso' };
  }
}

export const userService = new UserService();
