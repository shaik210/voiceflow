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
