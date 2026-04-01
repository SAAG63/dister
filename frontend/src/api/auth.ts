import { currentUser } from '../mocks/data';

export async function loginRequest(_email: string, _password: string) {
  await delay();
  return { token: 'mock-jwt-token', user: currentUser };
}

export async function registerRequest(_username: string, _email: string, _password: string) {
  await delay();
  return { token: 'mock-jwt-token', user: currentUser };
}

export async function refreshRequest(_refreshToken: string) {
  await delay();
  return { token: 'mock-jwt-token-refreshed' };
}

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}
