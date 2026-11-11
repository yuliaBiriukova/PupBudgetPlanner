import { ActionIcon } from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconGripVertical } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import classes from './CategorySheets.module.css';
import { useDragToSlot } from './useDragToSlot';

export interface PlaceListProps {
  label: string;
  /** The others in order, without the one being placed. */
  names: { id: string; name: string }[];
  /** The name of the one being placed. */
  current: string;
  /** Its place among the others, from 0. */
  place: number;
  setPlace: (place: number) => void;
}

/**
 * Where the thing being changed sits in its list (F-029): the others in order with it marked among them. Its grip
 * drags it, the arrows move it one place, both by touch and with the keyboard. Nothing to place it among: no list.
 */
export function PlaceList({ label, names, current, place, setPlace }: PlaceListProps) {
  const { t } = useTranslation();
  const { containerRef, drag, gripProps, rowProps } = useDragToSlot<HTMLOListElement>({
    anchors: '[data-drag-row="place"]',
    onDrop: (_, slot) => {
      setPlace(slot);
    },
  });
  if (names.length === 0) return null;
  const rows = [...names];
  rows.splice(place, 0, { id: '', name: current });

  return (
    <div className={classes.place}>
      <div className={classes.placeHead}>
        <span className={classes.fieldLabel}>{label}</span>
        <span className={classes.placeButtons}>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={t('categories.sheet.moveUp', { name: current })}
            disabled={place === 0}
            onClick={() => {
              setPlace(place - 1);
            }}
          >
            <IconArrowUp size={20} stroke={1.7} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={t('categories.sheet.moveDown', { name: current })}
            disabled={place >= names.length}
            onClick={() => {
              setPlace(place + 1);
            }}
          >
            <IconArrowDown size={20} stroke={1.7} />
          </ActionIcon>
        </span>
      </div>
      <ol ref={containerRef} className={classes.placeList} aria-label={label}>
        {rows.map((row) =>
          row.id === '' ? (
            <li
              key="current"
              {...rowProps('current', 'self')}
              className={classes.placeCurrent}
              aria-current="true"
            >
              <span className={classes.grip} {...gripProps('current')} aria-hidden>
                <IconGripVertical size={20} stroke={1.7} />
              </span>
              <span className={classes.name}>{row.name}</span>
            </li>
          ) : (
            <li key={row.id} data-drag-row="place" className={classes.placeRow}>
              {row.name}
            </li>
          ),
        )}
        {drag && <li className={classes.dropLine} style={{ top: drag.line }} aria-hidden />}
      </ol>
    </div>
  );
}
