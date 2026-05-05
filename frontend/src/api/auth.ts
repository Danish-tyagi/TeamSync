import api from './axios';
import { AuthResponse, LoginPayload, SignupPayload, User } from '../types';

export const authApi = {
  signup: async (data: SignupPayload): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/api/auth/signup', data);
    return res.data;
  },

  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/api/auth/login', data);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<{ success: boolean; user: User }>('/auth/me');
    return res.data.user;
  },

  getUsers: async (): Promise<User[]> => {
    const res = await api.get<{ success: boolean; users: User[] }>('/api/auth/users');
    return res.data.users;
  },
};
