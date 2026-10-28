import {
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme,
  type ActionIconProps,
} from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface ColorSchemeToggleProps {
  variant?: ActionIconProps['variant'];
  size?: ActionIconProps['size'];
  className?: string;
}

/** Switches between light and dark mode; the first visit follows the system setting. */
export function ColorSchemeToggle({
  variant = 'default',
  size = 'xl',
  className,
}: ColorSchemeToggleProps) {
  const { t } = useTranslation();
  const { setColorScheme } = useMantineColorScheme();
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = colorScheme === 'dark';

  return (
    <ActionIcon
      variant={variant}
      color={variant === 'subtle' ? 'gray' : undefined}
      size={size}
      className={className}
      aria-label={isDark ? t('colorScheme.switchToLight') : t('colorScheme.switchToDark')}
      onClick={() => {
        setColorScheme(isDark ? 'light' : 'dark');
      }}
    >
      {isDark ? <IconSun size={20} stroke={1.6} /> : <IconMoon size={20} stroke={1.6} />}
    </ActionIcon>
  );
}
