import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh } from '@tabler/icons-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import classes from './Pwa.module.css';
import { useUpdate } from './updates';

const TOAST_ID = 'app-update';

/**
 * After a release (F-025): a toast that stays until Reload or ×. Reload brings the new version; × keeps the old one
 * until the app is next started. Draws nothing itself.
 */
export function UpdateNotice() {
  const { t } = useTranslation();
  const reload = useUpdate();

  useEffect(() => {
    if (!reload) return;
    notifications.show({
      id: TOAST_ID,
      autoClose: false,
      // It stays until closed: a named × as big as a finger
      closeButtonProps: { 'aria-label': t('common.close'), size: 44 },
      message: (
        <span className={classes.update}>
          <span className={classes.updateText}>{t('pwa.update.ready')}</span>
          <Button
            leftSection={<IconRefresh size={20} stroke={1.7} />}
            onClick={() => {
              notifications.hide(TOAST_ID);
              reload();
            }}
          >
            {t('pwa.update.reload')}
          </Button>
        </span>
      ),
    });
  }, [reload, t]);

  return null;
}
