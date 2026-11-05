import { Button, UnstyledButton } from '@mantine/core';
import { IconBackspace, IconEqual, IconMinus, IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { isSum, type AmountKey } from './amount';
import classes from './TransactionForm.module.css';

const ICON = { size: 24, stroke: 1.7 } as const;

/** In the calculator's order: 7 8 9 ⌫ / 4 5 6 − / 1 2 3 + / 00 0 = Save. */
const KEYS: AmountKey[] = [
  '7',
  '8',
  '9',
  'back',
  '4',
  '5',
  '6',
  'minus',
  '1',
  '2',
  '3',
  'plus',
  '00',
  '0',
  'equals',
];

interface AmountKeysProps {
  /** The amount field, for = (on only while there is a sum to work out). */
  value: string;
  onKey: (key: AmountKey) => void;
  onSave: () => void;
  saving: boolean;
  /** The keys' box, for the swipe that folds them (I-028). */
  keysRef?: (element: HTMLDivElement | null) => void;
}

/**
 * The app's own keys on the phone (F-018 final prototype): the phone's keyboard never covers the form. + and − add up
 * a receipt, = works the sum out, Save saves. They come up on a tap on the amount and slide from the sheet's edge, the
 * sheet's grab handle on top: a swipe down or Back folds them (I-028).
 */
export function AmountKeys({ value, onKey, onSave, saving, keysRef }: AmountKeysProps) {
  const { t } = useTranslation();
  const labels: Partial<Record<AmountKey, string>> = {
    back: t('transactions.form.key.back'),
    minus: t('transactions.form.key.minus'),
    plus: t('transactions.form.key.plus'),
    equals: t('transactions.form.key.equals'),
  };

  const face = (key: AmountKey) => {
    switch (key) {
      case 'back':
        return <IconBackspace {...ICON} />;
      case 'minus':
        return <IconMinus {...ICON} />;
      case 'plus':
        return <IconPlus {...ICON} />;
      case 'equals':
        return <IconEqual {...ICON} />;
      default:
        return key;
    }
  };

  return (
    <div
      ref={keysRef}
      className={classes.keys}
      role="group"
      aria-label={t('transactions.form.keys')}
    >
      <div className={classes.keysHandle} aria-hidden="true" />
      {KEYS.map((key) => (
        <UnstyledButton
          key={key}
          className={classes.key}
          aria-label={labels[key]}
          disabled={key === 'equals' && !isSum(value)}
          onClick={() => {
            onKey(key);
          }}
        >
          {face(key)}
        </UnstyledButton>
      ))}
      <Button className={classes.save} loading={saving} onClick={onSave}>
        {t('transactions.form.save')}
      </Button>
    </div>
  );
}
