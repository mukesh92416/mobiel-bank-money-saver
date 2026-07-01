import { api } from '@/api/client'
import type { AuthResponse, LoginInput, RegisterInput, User } from '@/types'

export const authService = {
  login: (data: LoginInput) =>
    api.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterInput) =>
    api.post<AuthResponse>('/auth/register', data),

  logout: () =>
    api.post<{ message: string }>('/auth/logout'),

  refresh: () =>
    api.post<{ access_token: string }>('/auth/refresh'),

  getProfile: () =>
    api.get<{ user: User }>('/auth/profile'),

  updateProfile: (data: Partial<User>) =>
    api.put<{ message: string; user: User }>('/auth/profile', data),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  verifyEmail: (email: string, otp: string) =>
    api.post<{ message: string }>('/auth/verify-email', { email, otp }),
}
