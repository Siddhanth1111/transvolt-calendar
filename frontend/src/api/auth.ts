import api from './axios';
import type { AuthResponse } from '../types';

export const loginAPI = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerAPI = async (
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export const getMeAPI = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
