import { useReducedMotion } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { formatMoney } from '../format/money';

const DURATION = 700;

/**
 * An amount that counts up to `value` from `from` (after an account is added, F-014's one moment); without `from`
 * it simply shows `value`. Reduced motion shows the end at once.
 */
export function CountUp({
  value,
  from,
  currency,
}: {
  value: number;
  from?: number;
  currency: string;
}) {
  const reduce = useReducedMotion();
  // The amount on screen while counting, with the start it counts from (a new start begins from there)
  const [frame, setFrame] = useState<{ from: number; shown: number }>();
  const counting = from !== undefined && !reduce;

  useEffect(() => {
    if (from === undefined || reduce) return;
    let id = 0;
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / DURATION);
      setFrame({ from, shown: from + (value - from) * (1 - (1 - k) ** 3) });
      if (k < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(id);
    };
  }, [from, value, reduce]);

  const shown = !counting ? value : frame?.from === from ? frame.shown : from;
  return formatMoney(shown, currency);
}
