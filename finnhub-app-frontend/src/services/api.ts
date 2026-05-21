const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

type ApiError = { message: string | string[]; statusCode: number };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      message: 'Request failed',
      statusCode: response.status,
    }));
    const message = Array.isArray(error.message) ? error.message[0] : error.message;
    throw new Error(message ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

export type RegisterPayload = {
  email: string;
  password: string;
  name: string;
  lastName: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export const authApi = {
  register: (data: RegisterPayload) =>
    request<{ token: string }>('/user/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginPayload) =>
    request<{ token: string }>('/user/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; resetToken: string }>('/user/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>('/user/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  registerFcmToken: (deviceToken: string, authToken: string) =>
    request<{ message: string }>('/user/fcm-token', {
      method: 'PATCH',
      body: JSON.stringify({ token: deviceToken }),
      headers: { Authorization: `Bearer ${authToken}` },
    }),
};
