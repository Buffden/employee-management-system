export interface LoginRequest {
  username: string;
  password: string;
}

import { UserRole } from './user-role.enum';

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  employeeId: string | null;
  createdAt: string;
  lastLogin: string | null;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

