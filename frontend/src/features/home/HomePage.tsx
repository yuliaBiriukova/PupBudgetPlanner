import { Container, Group, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { ColorSchemeToggle } from '../../shared/ui/ColorSchemeToggle';

/** Placeholder start page until the app shell (F-010) arrives. */
export function HomePage() {
  const { t } = useTranslation();

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Group justify="space-between" wrap="nowrap">
          <Title order={1}>{t('app.name')}</Title>
          <ColorSchemeToggle />
        </Group>
        <Text c="dimmed">{t('home.comingSoon')}</Text>
      </Stack>
    </Container>
  );
}
