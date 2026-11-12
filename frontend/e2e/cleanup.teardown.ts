import { expect, test as teardown } from '@playwright/test';
import type { components } from '../src/shared/api/schema.ts';
import { antiforgery, signedInAdmin, TEST_PERSON_EMAIL } from './auth.ts';

type PersonItem = components['schemas']['PersonItem'];
type InvitationItem = components['schemas']['InvitationItem'];

/** The most people, or invite links, the API deletes at once (F-028, I-006). */
const DELETE_BATCH = 200;

/**
 * Links the tests made: notes that start with `E2E` (newInviteToken's default, people.spec.ts) or the one
 * signUpThroughApi gives.
 */
function isTestLink(note: string | null): boolean {
  if (note === null) return false;
  return (
    note.startsWith('E2E') || (note.startsWith('For ') && TEST_PERSON_EMAIL.test(note.slice(4)))
  );
}

// Runs after every run, passed or failed (I-007), so the shared dev database doesn't fill up with test accounts.
// Leftovers of earlier runs that broke off go too. The tests' admin stays: they can't delete themselves and every
// run reuses them.
teardown('remove the accounts and invite links the tests made', async () => {
  const admin = await signedInAdmin();
  try {
    const people = (await (await admin.get('/api/admin/people')).json()) as PersonItem[];
    const testIds = people
      .filter((person) => !person.isYou && TEST_PERSON_EMAIL.test(person.email))
      .map((person) => person.id);
    for (let start = 0; start < testIds.length; start += DELETE_BATCH) {
      const response = await admin.post('/api/admin/people/delete', {
        headers: await antiforgery(admin),
        data: { userIds: testIds.slice(start, start + DELETE_BATCH) },
      });
      expect(response.status(), 'deleting test accounts').toBe(204);
    }

    // The tests' links of any status, families' too, are deleted (I-006); before it they could only be cancelled
    const links = (await (await admin.get('/api/admin/invitations')).json()) as InvitationItem[];
    const linkIds = links.filter((l) => isTestLink(l.note)).map((l) => l.id);
    for (let start = 0; start < linkIds.length; start += DELETE_BATCH) {
      const response = await admin.post('/api/admin/invitations/delete', {
        headers: await antiforgery(admin),
        data: { ids: linkIds.slice(start, start + DELETE_BATCH) },
      });
      expect(response.status(), 'deleting test invite links').toBe(200);
    }
  } finally {
    await admin.dispose();
  }
});
