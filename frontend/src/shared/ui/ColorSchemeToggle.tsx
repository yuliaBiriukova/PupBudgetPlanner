import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

/** Switches between light and dark mode; the first visit follows the system setting. */
export function ColorSchemeToggle() {
  const { t } = useTranslation();
  const { setColorScheme } = useMantineColorScheme();
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = colorScheme === 'dark';

  return (
    <ActionIcon
      variant="default"
      size="xl"
      aria-label={isDark ? t('colorScheme.switchToLight') : t('colorScheme.switchToDark')}
      onClick={() => {
        setColorScheme(isDark ? 'light' : 'dark');
      }}
    >
      {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
    </ActionIcon>
  );
}
