import { expect, test } from '@playwright/test';
import { E2E_ADMIN, newPerson, TEST_PERSON_EMAIL } from './auth.ts';

// The clean-up deletes the people whose email matches TEST_PERSON_EMAIL (cleanup.teardown.ts); every person newPerson
// makes must match it, and nobody else (B-018). No browser: the same on the phone.
test.describe('the test people the clean-up finds', () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, 'No browser: the same on the phone');
  });

  test('every tag newPerson takes, digits included', () => {
    // The specs' tags and the screenshot scripts' ones that were left in the dev database before B-018
    for (const tag of [
      'accounts',
      'list-gap',
      'i022-shots',
      'i024-shots',
      'i028-shots',
      'i030-shots',
      'b004-shots',
      'b004-debug',
      'b009-shots',
    ]) {
      expect(newPerson(tag).email).toMatch(TEST_PERSON_EMAIL);
    }
    expect('e2e-i024-shots-1731300000000-k3x9qa@example.com').toMatch(TEST_PERSON_EMAIL);
  });

  test('nobody else', () => {
    for (const email of [
      E2E_ADMIN.email,
      'e2e-i024-shots@example.com',
      'e2e-accounts-1731300000000-k3x9qa@example.org',
      'e2e-accounts-1731300000000-k3x9qa@example.com.ua',
      'olena-1731300000000-k3x9qa@example.com',
      'E2E-accounts-1731300000000-k3x9qa@example.com',
    ]) {
      expect(email).not.toMatch(TEST_PERSON_EMAIL);
    }
  });

  test("newPerson refuses a tag the clean-up wouldn't find", () => {
    expect(() => newPerson('I024_Shots')).toThrow(/clean-up/);
    expect(() => newPerson('')).toThrow(/clean-up/);
  });
});
