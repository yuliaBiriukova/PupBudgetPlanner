import { Stack, Text, Title } from '@mantine/core';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

/** A section's page until its feature is built: the title and what will be here. */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Stack gap="sm">
      <Title order={1}>{title}</Title>
      <Text c="dimmed">{description}</Text>
    </Stack>
  );
}
