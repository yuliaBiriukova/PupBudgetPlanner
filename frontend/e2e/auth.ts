import type { APIRequestContext } from '@playwright/test';

/** Where the setup project keeps the signed-in person's cookies (git-ignored). */
export const AUTH_FILE = 'playwright/.auth/user.json';

export interface Person {
  displayName: string;
  email: string;
  password: string;
}

/** A person nobody has used yet: every run creates new accounts (CI starts from an empty database). */
export function newPerson(tag: string): Person {
  const id = `${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    displayName: 'Olena',
    email: `e2e-${tag}-${id}@example.com`,
    password: 'kyiv-budget-26',
  };
}

/** Creates the account like the app does: first the antiforgery token, then the request with it. */
export async function signUpThroughApi(request: APIRequestContext, person: Person) {
  await request.get('/api/auth/me');
  const token = (await request.storageState()).cookies.find((c) => c.name === 'XSRF-TOKEN')?.value;
  return request.post('/api/auth/register', {
    headers: { 'X-XSRF-TOKEN': token ?? '' },
    data: person,
  });
}
