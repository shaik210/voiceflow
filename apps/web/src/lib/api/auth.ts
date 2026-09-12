import { getAccessToken, setAccessToken, removeAccessToken } from './token';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface User {
  id: string;
  email: string;
  name?: string | null;
}

export interface AuthResponse {
  success: boolean;
  accessToken: string;
  user: User;
}

export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    let errorMessage = 'Registration failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Use fallback
    }
    throw new Error(errorMessage);
  }

  const data: AuthResponse = await response.json();
  setAccessToken(data.accessToken);
  return data;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let errorMessage = 'Login failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Use fallback
    }
    throw new Error(errorMessage);
  }

  const data: AuthResponse = await response.json();
  setAccessToken(data.accessToken);
  return data;
}

export async function getMe(): Promise<User | null> {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeAccessToken();
      }
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch {
    return null;
  }
}

export function logout(): void {
  removeAccessToken();
}
