import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { createQueryClient } from './queryClient';
import { cssVariablesResolver, theme } from './theme';

interface AppProvidersProps {
  children: ReactNode;
  /** Tests pass their own client (no retries, fresh cache per test). */
  queryClient?: QueryClient;
}

export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient());

  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="auto"
    >
      <DatesProvider settings={{ locale: 'en', firstDayOfWeek: 1 }}>
        <Notifications />
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </DatesProvider>
    </MantineProvider>
  );
}
