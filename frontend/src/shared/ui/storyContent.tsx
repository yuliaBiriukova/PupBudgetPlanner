import { Button, Checkbox, Stack, Text } from '@mantine/core';

// Story-only content: a long form, like "Categories to show" in the I-004 prototype (the default categories).
const GROUPS: [string, string[]][] = [
  [
    'Home expenses',
    [
      'Rent',
      'Bills',
      'Home supplies',
      'Electronics',
      'Bank commission',
      'Gifts',
      'Tax',
      'Delivery',
    ],
  ],
  [
    'Daily living',
    ['Groceries', 'Clothing', 'Eating out', 'Transportation', 'Salon/Barber', 'Sport'],
  ],
  ['Health', ['Doctor/Dentist', 'Medicine/Drugs/Skincare', 'Emergency', 'Therapy']],
  ['Education', ['English lessons', 'Piano lessons', 'Driving']],
  ['Entertainment', ['Activities', 'Books', 'Games', 'Hobbies', 'Vacation']],
];

/** A list longer than any screen, to show the content scrolling between the title and the buttons. */
export function LongCategoryList() {
  return (
    <Stack gap="lg">
      {GROUPS.map(([group, categories]) => (
        <Checkbox.Group key={group} label={group} defaultValue={categories}>
          <Stack gap="md" mt="sm">
            {categories.map((name) => (
              <Checkbox key={name} value={name} label={name} />
            ))}
          </Stack>
        </Checkbox.Group>
      ))}
      <Text c="dimmed" size="sm">
        Hidden categories stay in reports.
      </Text>
    </Stack>
  );
}

/** Cancel and Save, as the footer of a long form. */
export function SaveButtons() {
  return (
    <>
      <Button radius="xl" variant="subtle" color="gray">
        Cancel
      </Button>
      <Button radius="xl">Save</Button>
    </>
  );
}
