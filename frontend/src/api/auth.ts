import client from './client';

export async function loginRequest(email: string, password: string) {
  const { data } = await client.post('/auth/login', { email, password });
  return data;
}

export async function registerRequest(username: string, email: string, password: string) {
  const { data } = await client.post('/auth/register', { username, email, password });
  return data;
}

export async function refreshRequest(refreshToken: string) {
  const { data } = await client.post('/auth/refresh', { refreshToken });
  return data;
}

export async function logoutRequest(refreshToken: string) {
  await client.post('/auth/logout', { refreshToken });
}
