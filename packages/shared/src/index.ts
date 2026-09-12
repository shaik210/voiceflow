export interface HealthResponse {
  status: string;
  service: string;
  timestamp?: string;
}

export interface UserDTO {
  id: string;
  email: string;
  name?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
}
