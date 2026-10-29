import { request as playwrightRequest, type APIRequestContext } from '@playwright/test';

/** Where the setup project keeps the signed-in person's cookies (git-ignored). */
export const AUTH_FILE = 'playwright/.auth/user.json';

/**
 * Locally the Vite dev server; in CI the production build served by `vite preview` (see vite.config.ts). Set
 * E2E_BASE_URL to test an app that is already running elsewhere.
 */
export const BASE_URL =
  process.env.E2E_BASE_URL ?? (process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173');

export interface Person {
  displayName: string;
  email: string;
  password: string;
}

/**
 * The tests' admin (F-028): the API gets its email as `Access__AdminEmails__1` (playwright.config.ts; locally also
 * in user-secrets), and in Development an admin email may create its account with a password and no invite link.
 * Test values only.
 */
export const E2E_ADMIN: Person = {
  displayName: 'E2E Admin',
  email: 'e2e-admin@example.com',
  password: 'kyiv-budget-26',
};

/** A person nobody has used yet: every run creates new accounts (CI starts from an empty database). */
export function newPerson(tag: string): Person {
  const id = `${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    displayName: 'Olena',
    email: `e2e-${tag}-${id}@example.com`,
    password: 'kyiv-budget-26',
  };
}

/** The antiforgery token for whoever the context is signed in as (it changes when they sign in). */
async function antiforgery(request: APIRequestContext): Promise<Record<string, string>> {
  await request.get('/api/auth/me');
  const token = (await request.storageState()).cookies.find((c) => c.name === 'XSRF-TOKEN')?.value;
  return { 'X-XSRF-TOKEN': token ?? '' };
}

/** A request context signed in as the tests' admin; their account is made on the first run. */
export async function signedInAdmin(): Promise<APIRequestContext> {
  const admin = await playwrightRequest.newContext({ baseURL: BASE_URL });
  const login = { email: E2E_ADMIN.email, password: E2E_ADMIN.password };
  let response = await admin.post('/api/auth/login', {
    headers: await antiforgery(admin),
    data: login,
  });
  if (!response.ok()) {
    response = await admin.post('/api/auth/register', {
      headers: await antiforgery(admin),
      data: E2E_ADMIN,
    });
  }
  if (!response.ok()) throw new Error(`The E2E admin can't sign in: ${String(response.status())}`);
  return admin;
}

/** A new invite link's token, made by the tests' admin. */
export async function newInviteToken(note = 'E2E'): Promise<string> {
  const admin = await signedInAdmin();
  try {
    const response = await admin.post('/api/admin/invitations', {
      headers: await antiforgery(admin),
      data: { note },
    });
    if (!response.ok()) throw new Error(`No invite link: ${String(response.status())}`);
    return ((await response.json()) as { token: string }).token;
  } finally {
    await admin.dispose();
  }
}

/** Creates the account like the invite page does: with a new invite link and the antiforgery token. */
export async function signUpThroughApi(request: APIRequestContext, person: Person) {
  const inviteToken = await newInviteToken(`For ${person.email}`);
  return request.post('/api/auth/register', {
    headers: await antiforgery(request),
    data: { ...person, inviteToken },
  });
}
