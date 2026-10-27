import { describe, expect, it } from 'vitest';
import { resolveDrag, resolveStep, SIDEBAR } from './useSidebar';

const MIN = 236;

describe('resolveDrag', () => {
  it('snaps to the rail below the snap point and keeps the last width for later', () => {
    expect(resolveDrag(SIDEBAR.snap - 1, MIN, 260)).toEqual({ width: 260, collapsed: true });
  });

  it('never goes narrower than the minimum, so the app name stays whole', () => {
    expect(resolveDrag(180, MIN, 248)).toEqual({ width: MIN, collapsed: false });
  });

  it('never goes wider than the maximum', () => {
    expect(resolveDrag(500, MIN, 248)).toEqual({ width: SIDEBAR.max, collapsed: false });
  });

  it('follows the pointer in between', () => {
    expect(resolveDrag(280.4, MIN, 248)).toEqual({ width: 280, collapsed: false });
  });
});

describe('resolveStep', () => {
  it('widens by one step', () => {
    expect(resolveStep({ width: 248, collapsed: false }, 'wider', MIN)).toEqual({
      width: 264,
      collapsed: false,
    });
  });

  it('expands the rail to the last width', () => {
    expect(resolveStep({ width: 260, collapsed: true }, 'wider', MIN)).toEqual({
      width: 260,
      collapsed: false,
    });
  });

  it('narrows by one step, then collapses once the next step would cut the name', () => {
    expect(resolveStep({ width: 260, collapsed: false }, 'narrower', MIN)).toEqual({
      width: 244,
      collapsed: false,
    });
    expect(resolveStep({ width: 244, collapsed: false }, 'narrower', MIN)).toEqual({
      width: 244,
      collapsed: true,
    });
  });
});
