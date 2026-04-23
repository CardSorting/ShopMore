/**
 * [LAYER: CORE]
 */
import type { IAuthProvider } from '@domain/repositories';
import type { User } from '@domain/models';
import { AuthError, UnauthorizedError } from '@domain/errors';

export class AuthService {
  constructor(private provider: IAuthProvider) {}

  async getCurrentUser(): Promise<User | null> {
    return this.provider.getCurrentUser();
  }

  async signIn(email: string, password: string): Promise<User> {
    return this.provider.signIn(email, password);
  }

  async signUp(
    email: string,
    password: string,
    displayName: string
  ): Promise<User> {
    return this.provider.signUp(email, password, displayName);
  }

  async signOut(): Promise<void> {
    return this.provider.signOut();
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return this.provider.onAuthStateChanged(callback);
  }

  requireAuth(user: User | null): asserts user is User {
    if (!user) throw new AuthError();
  }

  requireAdmin(user: User | null): asserts user is User & { role: 'admin' } {
    this.requireAuth(user);
    if (user.role !== 'admin') throw new UnauthorizedError();
  }
}