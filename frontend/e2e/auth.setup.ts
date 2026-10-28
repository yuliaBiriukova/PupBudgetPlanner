import { expect, test as setup } from '@playwright/test';
import { AUTH_FILE, newPerson, signUpThroughApi } from './auth.ts';

// One person for the tests that need a signed-in app; their cookies are reused by every project
setup('create a signed-in test person', async ({ request }) => {
  const response = await signUpThroughApi(request, newPerson('shared'));

  expect(response.ok()).toBe(true);
  await request.storageState({ path: AUTH_FILE });
});
