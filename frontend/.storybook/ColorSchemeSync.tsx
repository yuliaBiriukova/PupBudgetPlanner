import { useMantineColorScheme } from '@mantine/core';
import { useEffect, useEffectEvent, type ReactNode } from 'react';

export type ColorScheme = 'light' | 'dark';

interface ColorSchemeSyncProps {
  colorScheme: ColorScheme;
  children: ReactNode;
}

/**
 * Applies the color scheme picked in the Storybook toolbar to Mantine. Only a toolbar change re-applies it,
 * so components that switch the scheme themselves (ColorSchemeToggle) keep working inside stories.
 */
export function ColorSchemeSync({ colorScheme, children }: ColorSchemeSyncProps) {
  const { setColorScheme } = useMantineColorScheme();
  const applyColorScheme = useEffectEvent((value: ColorScheme) => {
    setColorScheme(value);
  });

  useEffect(() => {
    applyColorScheme(colorScheme);
  }, [colorScheme]);

  return children;
}
