import { Button, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <Stack align="flex-start" gap="sm">
      <Title order={1}>{t('notFound.title')}</Title>
      <Text c="dimmed">{t('notFound.description')}</Text>
      <Button component={Link} to="/" mt="xs">
        {t('notFound.backHome')}
      </Button>
    </Stack>
  );
}
