export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  warehouseId?: string;
  avatar?: string;
}

export interface JwtPayload {
  sub: string;
  username?: string;
  email: string;
  full_name?: string;
  language?: string;
  role?: string;
  permission?: string | string[];
  permissions?: string[];
  iat?: number;
  exp: number;
  [claim: string]: unknown;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
  captchaToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}
