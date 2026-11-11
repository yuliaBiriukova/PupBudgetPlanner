import { Button, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from '../../shared/ui/cx';
import classes from './Family.module.css';
import { FAMILY_NAME_MAX, FamilyError, useStartFamily } from './familyApi';
import { useFamilyNameError } from './familyText';

/** What being in a family means, said the same way on every screen that asks you to join or start one. */
export function WhatItMeans({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <ul className={cx(classes.means, className)}>
      <li>{t('family.means.see')}</li>
      <li>{t('family.means.own')}</li>
      <li>{t('family.means.leave')}</li>
    </ul>
  );
}

/** Family name and Start a family. */
export function StartFamilyForm() {
  const { t } = useTranslation();
  const start = useStartFamily();
  const nameError = useFamilyNameError();
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const error = nameError(name, touched);

  return (
    <form
      noValidate
      className={classes.startForm}
      onSubmit={(event) => {
        event.preventDefault();
        setTouched(true);
        if (nameError(name, true)) return;
        const trimmed = name.trim();
        start.mutate(trimmed, {
          onSuccess: () =>
            notifications.show({ message: t('family.start.started', { name: trimmed }) }),
          onError: (failure) =>
            notifications.show({
              color: 'red',
              message:
                failure instanceof FamilyError && failure.failure === 'alreadyInFamily'
                  ? t('family.start.already')
                  : t('family.failed'),
            }),
        });
      }}
    >
      <TextInput
        label={t('family.start.nameLabel')}
        description={t('family.start.nameHint')}
        placeholder={t('family.start.namePlaceholder')}
        value={name}
        maxLength={FAMILY_NAME_MAX}
        error={error}
        onChange={(event) => {
          setName(event.currentTarget.value);
        }}
      />
      <Button type="submit" className={classes.startButton} loading={start.isPending}>
        {t('family.start.button')}
      </Button>
    </form>
  );
}
