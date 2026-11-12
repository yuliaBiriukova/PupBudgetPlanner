import { describe, expect, it, vi } from 'vitest';
import { ANDRIY_ID, IRYNA_ID, OLENA_ID, ownersFamily } from './familyTestData';
import { FAMILY, inLensOrder, ME, whoParam, whoseOf } from './whose';

const family = ownersFamily();
const couple = inLensOrder(family.members.slice(0, 2));
const setWho = vi.fn();

describe('whose money (F-024)', () => {
  it('is always your own without a family, or alone in one', () => {
    const alone = inLensOrder(family.members.slice(0, 1));

    for (const people of [[], alone]) {
      const whose = whoseOf(FAMILY, people, OLENA_ID, setWho);
      expect(whose.who).toBe(ME);
      expect(whose.lens).toBe(false);
      expect(whose.isMine(ANDRIY_ID)).toBe(true);
    }
  });

  it('is a member’s to look at only, and the family’s with yours still yours', () => {
    const andriys = whoseOf(ANDRIY_ID, couple, OLENA_ID, setWho);
    const familys = whoseOf(FAMILY, couple, OLENA_ID, setWho);

    expect(andriys).toMatchObject({ who: ANDRIY_ID, lens: true, theirs: true, context: 'their' });
    expect(andriys.person?.displayName).toBe('Andriy');
    expect(andriys.isMine(ANDRIY_ID)).toBe(false);
    expect(familys).toMatchObject({ who: FAMILY, theirs: false, context: 'family' });
    expect(familys.isMine(OLENA_ID)).toBe(true);
    expect(familys.isMine(ANDRIY_ID)).toBe(false);
    expect(familys.nameOf(ANDRIY_ID)).toBe('Andriy');
  });

  it('is your own for someone who isn’t in the family (any more)', () => {
    expect(whoseOf(IRYNA_ID, couple, OLENA_ID, setWho).who).toBe(ME);
    expect(whoseOf(OLENA_ID, couple, OLENA_ID, setWho).who).toBe(ME);
  });

  it('keeps the kept choice while the family loads, without the lens', () => {
    const loading = whoseOf(ANDRIY_ID, null, OLENA_ID, setWho);

    expect(loading).toMatchObject({ who: ANDRIY_ID, lens: false, theirs: true });
    expect(loading.isMine(ANDRIY_ID)).toBe(false);
  });

  it('lists you first, then the others as they joined, and asks the API for nobody when it is yours', () => {
    const shuffled = [family.members[2], family.members[0], family.members[1]].filter(
      (member) => member !== undefined,
    );

    expect(inLensOrder(shuffled).map((member) => member.displayName)).toEqual([
      'Olena',
      'Andriy',
      'Iryna',
    ]);
    expect(whoParam(ME)).toBeUndefined();
    expect(whoParam(FAMILY)).toBe('family');
  });
});
