import {
  ActionIcon,
  Button,
  Checkbox,
  Menu,
  Radio,
  SegmentedControl,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import {
  IconArchive,
  IconBan,
  IconCheck,
  IconDots,
  IconLayoutSidebarLeftCollapse,
  IconLogout,
  IconPlus,
  IconRestore,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import sidebar from '../../app/shell/Sidebar.module.css';
import {
  AuthSwitch,
  PasswordField,
  SubmitButton,
  TextField,
} from '../../features/auth/AuthFormParts';
import { Choice } from '../../features/settings/SettingsPage';
import { AmountKeys } from '../../features/transactions/AmountKeys';
import form from '../../features/transactions/TransactionForm.module.css';
import list from '../../features/transactions/TransactionsPage.module.css';
import { ColorSchemeToggle } from '../ui/ColorSchemeToggle';
import { cx } from '../ui/cx';
import pills from '../ui/Pills.module.css';
import classes from './DesignSystem.module.css';
import { Page, Section, Spec, Specs } from './DesignSystemParts';

// The app's elements, one look each (I-019, approved 2026-11-04), built with the app's own components and the theme
// (theme.ts), with where each one is used. A new screen takes its elements from here.

function Buttons() {
  return (
    <Page
      intro={
        <>
          Every button is a 44 px pill, set once in <code>theme.ts</code>: no <code>radius</code> or
          height on a button. Four kinds, picked with <code>variant</code>. Only the sign-in screens
          have a 52 px button.
        </>
      }
    >
      <Section title="Kinds">
        <Specs>
          <Spec
            name="Primary · the default"
            where="The main action: Save, New account, Add transaction, Try again. One per place"
          >
            <Button>Save</Button>
            <Button leftSection={<IconPlus size={20} stroke={1.7} />}>New account</Button>
            <Button loading>Save</Button>
          </Spec>
          <Spec
            name={'Grey word · variant="quiet"'}
            where="Second choices next to the primary one (Cancel, Keep it, Clear all) and actions in rows (Restore, Archive)"
          >
            <Button variant="quiet">Cancel</Button>
            <Button>Save</Button>
            <Button variant="quiet" leftSection={<IconRestore size={20} stroke={1.7} />}>
              Restore
            </Button>
            <Button variant="quiet" leftSection={<IconArchive size={20} stroke={1.7} />}>
              Archive
            </Button>
          </Spec>
          <Spec
            name={'Red pill · variant="danger"'}
            where="Confirms a delete in the question that asks first; faded until the confirmation is typed"
          >
            <Button variant="quiet">Keep it</Button>
            <Button variant="danger">Delete for good</Button>
            <Button variant="danger" disabled>
              Delete for good
            </Button>
          </Spec>
          <Spec
            name={'Red word · variant="danger-quiet"'}
            where="Delete in rows and forms, always with its icon; it opens the question"
          >
            <Button variant="danger-quiet" leftSection={<IconTrash size={20} stroke={1.7} />}>
              Delete
            </Button>
          </Spec>
        </Specs>
      </Section>

      <Section title="In their places">
        <Specs>
          <Spec
            name="Sidebar · Add transaction"
            where="The desktop sidebar, full and collapsed into the rail"
          >
            <div className={classes.sidebarBox} style={{ width: 240 }}>
              <UnstyledButton className={sidebar.add} style={{ marginBottom: 0 }}>
                <IconPlus size={20} stroke={1.7} />
                <span className={sidebar.label}>Add transaction</span>
              </UnstyledButton>
            </div>
            <div className={classes.sidebarBox} style={{ width: 72 }}>
              <UnstyledButton
                className={sidebar.add}
                style={{ width: 44, marginBottom: 0, marginInline: 2, padding: 0 }}
                aria-label="Add transaction"
              >
                <IconPlus size={20} stroke={1.7} />
              </UnstyledButton>
            </div>
          </Spec>
          <Spec
            name="Sign-in · 52 px"
            where="Sign in, Create account, the invite page: full width under 52 px fields"
          >
            <div style={{ width: 320 }}>
              <SubmitButton pending={false} label="Sign in" pendingLabel="Signing in" />
            </div>
          </Spec>
          <Spec
            name="Phone keypad"
            where="Under the transaction form on the phone: 52 px pill keys and Save"
          >
            <div style={{ width: 375, padding: '8px 16px 16px', overflow: 'hidden' }}>
              <AmountKeys
                value="12+30"
                onKey={() => undefined}
                onSave={() => undefined}
                saving={false}
              />
            </div>
          </Spec>
        </Specs>
      </Section>
    </Page>
  );
}

function IconButtons() {
  return (
    <Page
      intro={
        <>
          Buttons with only an icon: a 44 px circle (the theme&apos;s <code>ActionIcon</code>{' '}
          default), always with an <code>aria-label</code>. Icons are Tabler&apos;s at 16, 20 or 24
          px with a 1.7 stroke.
        </>
      }
    >
      <Section title="Icon buttons">
        <Specs>
          <Spec
            name="Grey · 44 px circle"
            where="⋯ on a row, Delete in the phone's form, clear a search, collapse the sidebar, Sign out"
          >
            <ActionIcon variant="subtle" color="gray" aria-label="Actions">
              <IconDots size={20} stroke={1.7} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" aria-label="Delete">
              <IconTrash size={20} stroke={1.7} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" aria-label="Clear">
              <IconX size={20} stroke={1.7} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" aria-label="Collapse the sidebar">
              <IconLayoutSidebarLeftCollapse size={20} stroke={1.7} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" aria-label="Sign out">
              <IconLogout size={20} stroke={1.7} />
            </ActionIcon>
          </Spec>
          <Spec name="Light or dark" where="The sidebar's account row and the phone's top bar">
            <ColorSchemeToggle />
          </Spec>
        </Specs>
      </Section>
    </Page>
  );
}

function SignInSwitch() {
  const [router] = useState(() =>
    createMemoryRouter([{ path: '*', element: <AuthSwitch /> }], { initialEntries: ['/sign-in'] }),
  );
  return <RouterProvider router={router} />;
}

function Switches() {
  const [groupBy, setGroupBy] = useState('currency');
  const [type, setType] = useState('Expense');
  const [scheme, setScheme] = useState('system');
  return (
    <Page
      intro={
        <>
          One pill switch: a 44 px track in the <code>choice</code> colour, the picked option raised
          in the text colour. Mantine&apos;s <code>SegmentedControl</code> gets it from the theme;
          Settings (radio buttons) and sign-in (links) are built to the same look.
        </>
      }
    >
      <Section title="Switches">
        <Specs>
          <Spec name="SegmentedControl" where="Accounts: Group by">
            <SegmentedControl
              aria-label="Group by"
              value={groupBy}
              onChange={setGroupBy}
              data={[
                { value: 'currency', label: 'Currency' },
                { value: 'source', label: 'Source' },
              ]}
            />
          </Spec>
          <Spec
            name="The transaction type"
            where="The transaction form's title row: the picked type in its colour"
          >
            <SegmentedControl
              aria-label="Type"
              value={type}
              onChange={setType}
              data={['Expense', 'Income', 'Transfer']}
              data-type={type}
              className={form.typeSwitch}
            />
          </Spec>
          <Spec name="Radio buttons" where="Settings: report currency, theme">
            <span id="ds-theme" hidden>
              Theme
            </span>
            <Choice
              name="ds-theme"
              labelledBy="ds-theme"
              value={scheme}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
              onChange={setScheme}
            />
          </Spec>
          <Spec name="Links" where="The sign-in screens: Sign in / Create account">
            <div style={{ width: 320 }}>
              <SignInSwitch />
            </div>
          </Spec>
        </Specs>
      </Section>
    </Page>
  );
}

function Pills() {
  const [bank, setBank] = useState('Monobank');
  const [category, setCategory] = useState('Groceries');
  const [kind, setKind] = useState('Expense');
  return (
    <Page
      intro={
        <>
          Pills you pick from: <code>shared/ui/Pills.module.css</code>, 44 px with the fields&apos;
          border, the picked one in the accent&apos;s tint. It works for a radio card, a{' '}
          <code>role=&quot;radio&quot;</code> button and a pressed button.
        </>
      }
    >
      <Section title="Pills you pick">
        <Specs>
          <Spec name="Radio cards" where="The account form: bank or source">
            <Radio.Group value={bank} onChange={setBank} aria-label="Bank">
              <div className={pills.pills}>
                {['Monobank', 'PrivatBank', 'Cash'].map((name) => (
                  <Radio.Card key={name} value={name} withBorder={false} className={pills.pill}>
                    {name}
                  </Radio.Card>
                ))}
              </div>
            </Radio.Group>
          </Spec>
          <Spec name="With a tick" where="The transaction form: the most used categories">
            <div className={pills.pills} role="radiogroup" aria-label="Category">
              {['Groceries', 'Eating out', 'Transport'].map((name) => (
                <UnstyledButton
                  key={name}
                  role="radio"
                  className={pills.pill}
                  aria-checked={name === category}
                  onClick={() => {
                    setCategory(name);
                  }}
                >
                  {name === category && <IconCheck size={16} stroke={1.7} aria-hidden />}
                  {name}
                </UnstyledButton>
              ))}
            </div>
          </Spec>
          <Spec
            name="A type in its colour"
            where="The phone's Filters sheet: Expense, Income, Transfer"
          >
            <div className={pills.pills}>
              {['Expense', 'Income', 'Transfer'].map((name) => (
                <UnstyledButton
                  key={name}
                  className={cx(pills.pill, list.typePill)}
                  aria-pressed={name === kind}
                  data-type={name}
                  onClick={() => {
                    setKind(name);
                  }}
                >
                  {name}
                </UnstyledButton>
              ))}
            </div>
          </Spec>
          <Spec name="Picked filter chip" where="Over the phone's receipts, with × to remove it">
            <span className={list.chip}>
              <span>Eating out</span>
              <UnstyledButton className={list.chipClear} aria-label="Remove Eating out">
                <IconX size={16} stroke={1.7} />
              </UnstyledButton>
            </span>
          </Spec>
        </Specs>
      </Section>
    </Page>
  );
}

function Fields() {
  return (
    <Page
      intro={
        <>
          One field, set in the theme: 52 px, 16 px text and 16 px inside, the surface behind it and
          the fields&apos; border; in focus a 2 px accent border, with a mistake a red one. A
          list&apos;s search is the same field at 48 px.
        </>
      }
    >
      <Section title="Fields">
        <Specs>
          <Spec name="Text" where="Every form: names, amounts, the note, Type delete to confirm">
            <TextInput label="Name" defaultValue="Monobank black" w={280} />
          </Spec>
          <Spec name="With a mistake" where="Under the field, in plain language (DESIGN_RULES §6)">
            <TextInput
              label="Opening balance"
              defaultValue="12,5,0"
              error="Type an amount, like 1 250"
              w={280}
            />
          </Spec>
          <Spec name="Search" where="People's search; at 48 px in the currency and category lists">
            <TextInput
              aria-label="Search"
              placeholder="Search by name or email"
              leftSection={<IconSearch size={20} stroke={1.7} />}
              w={280}
            />
          </Spec>
          <Spec name="Sign-in" where="Email and password, with their own labels and messages">
            <div style={{ display: 'grid', gap: 16, width: 320 }}>
              <TextField label="Email" defaultValue="yulia@example.com" />
              <PasswordField label="Password" defaultValue="a-long-password" />
            </div>
          </Spec>
        </Specs>
      </Section>
    </Page>
  );
}

function ChecksAndMenus() {
  return (
    <Page
      intro={
        <>
          Check boxes are themed once in <code>theme.ts</code>: a 6 px rounded square, the accent
          when on. Menus are Mantine&apos;s with 44 px items; Delete in the app&apos;s red.
        </>
      }
    >
      <Section title="Check boxes">
        <Specs>
          <Spec
            name="Off, on, some picked, disabled"
            where="People: picking people for Block / Delete"
          >
            <Checkbox aria-label="Off" />
            <Checkbox aria-label="On" defaultChecked />
            <Checkbox aria-label="Some" indeterminate />
            <Checkbox aria-label="Disabled" disabled />
          </Spec>
        </Specs>
      </Section>
      <Section title="Menus">
        <Specs>
          <Spec name="Row menu" where="⋯ on a person's row">
            <div style={{ minHeight: 168 }}>
              <Menu opened position="bottom-start" shadow="md" width={230} withinPortal={false}>
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray" aria-label="Actions">
                    <IconDots size={20} stroke={1.7} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconBan size={20} stroke={1.7} />}>Block</Menu.Item>
                  <Menu.Item
                    color="var(--pup-color-danger)"
                    leftSection={<IconTrash size={20} stroke={1.7} />}
                  >
                    Delete
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </div>
          </Spec>
        </Specs>
      </Section>
    </Page>
  );
}

const meta = {
  title: 'Design system/Components',
  parameters: {
    docs: {
      description: {
        component: "The app's elements, one look each (I-019), with where each one is used.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllButtons: Story = { name: 'Buttons', render: () => <Buttons /> };

export const AllIconButtons: Story = { name: 'Icon buttons', render: () => <IconButtons /> };

export const AllSwitches: Story = { name: 'Switches', render: () => <Switches /> };

export const AllPills: Story = { name: 'Pills and chips', render: () => <Pills /> };

export const AllFields: Story = { name: 'Fields', render: () => <Fields /> };

export const ChecksMenus: Story = {
  name: 'Check boxes and menus',
  render: () => <ChecksAndMenus />,
};
