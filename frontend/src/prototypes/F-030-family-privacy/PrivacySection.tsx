import { Collapse, Menu, UnstyledButton } from '@mantine/core';
import { IconCheck, IconChevronDown, IconPlus } from '@tabler/icons-react';
import { useId, useState, type ReactNode } from 'react';
import { CardStyleMini } from '../../features/accounts/AccountCard';
import type { Account } from '../../features/accounts/accountsApi';
import tags from '../../features/categories/Categories.module.css';
import type { Family } from '../../features/family/familyApi';
import settings from '../../features/settings/Settings.module.css';
import { cx } from '../../shared/ui/cx';
import pills from '../../shared/ui/Pills.module.css';
import classes from './FamilyPrivacy.module.css';
import { ICON, useOwnMoney, whereOf } from './ownMoney';
import { CategoriesDialog, LevelIcon, LinesChoice, PrivateTags } from './PrivacyParts';
import { LEVELS, LINES, labelOf, levelOf, seeOf, seersOf, usePrivacy } from './privacy';

/**
 * "What the family sees of your money" on the Family page (final prototype: variant 1 "Rows", folding): three rows,
 * each with what is set now; a tap unfolds it to change it. They start folded; several can be open.
 */
export function PrivacySection({ family }: { family: Family }) {
  const seers = seersOf(family.members);
  const see = seeOf(family.members);
  const { privacy } = usePrivacy();
  const { accounts, groups } = useOwnMoney();
  const [picking, setPicking] = useState(false);

  const hidden = accounts.filter((account) => levelOf(privacy, account.id) === 'Hidden').length;
  const balance = accounts.filter(
    (account) => levelOf(privacy, account.id) === 'BalanceOnly',
  ).length;
  const shared = accounts.length - hidden - balance;
  const accountsSummary =
    shared === accounts.length
      ? `All ${String(accounts.length)} shared`
      : [
          shared > 0 && `${String(shared)} shared`,
          balance > 0 && `${String(balance)} balance only`,
          hidden > 0 && `${String(hidden)} hidden`,
        ]
          .filter(Boolean)
          .join(', ');
  const kept = groups
    .flatMap((group) => group.categories)
    .filter((category) => privacy.categories.includes(category.id));
  const categoriesSummary =
    kept.length === 0
      ? 'None'
      : kept.length <= 2
        ? kept.map((category) => category.name).join(', ')
        : `${String(kept.length)} categories`;

  return (
    <section className={settings.section}>
      <div>
        <h2 className={settings.title}>What the family sees</h2>
        <div className={settings.text}>
          {seers} {see} your money as you set it here. A change counts at once; nothing is deleted
          or moved.
        </div>
      </div>
      <div className={settings.control}>
        <div className={classes.folds}>
          <Fold
            title="Your transactions"
            summary={LINES.find((item) => item.value === privacy.lines)?.label ?? ''}
          >
            <LinesChoice plain label="What the family sees of your transactions" />
          </Fold>
          <Fold title="Your accounts" summary={accountsSummary}>
            <ul className={classes.accountRows}>
              {accounts.map((account) => (
                <AccountRow key={account.id} account={account} />
              ))}
            </ul>
          </Fold>
          <Fold title="Private categories" summary={categoriesSummary}>
            <p className={classes.quiet}>
              {seers} {see} nothing of a private category: not it, its transactions or its total.
            </p>
            <PrivateTags groups={groups} />
            <div>
              <UnstyledButton
                className={cx(tags.tag, tags.addTag)}
                onClick={() => {
                  setPicking(true);
                }}
              >
                <IconPlus size={16} stroke={1.7} aria-hidden />
                Choose categories
              </UnstyledButton>
            </div>
          </Fold>
        </div>
      </div>
      <CategoriesDialog
        opened={picking}
        seers={seers}
        onClose={() => {
          setPicking(false);
        }}
      />
    </section>
  );
}

/** A row that folds: its title and what is set now; a tap shows what it is made of. */
function Fold({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  return (
    <div className={classes.fold}>
      <UnstyledButton
        className={classes.foldHead}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => {
          setOpen((now) => !now);
        }}
      >
        <span className={classes.foldText}>
          <span className={classes.foldTitle}>{title}</span>
          <span className={classes.foldSummary}>{summary}</span>
        </span>
        <IconChevronDown {...ICON} aria-hidden className={classes.foldChevron} />
      </UnstyledButton>
      <Collapse expanded={open} transitionDuration={160}>
        <div id={bodyId} className={classes.foldBody}>
          {children}
        </div>
      </Collapse>
    </div>
  );
}

/** One account: its style, name and bank; on the right its level, a pill opening the three. */
function AccountRow({ account }: { account: Account }) {
  const { privacy, setLevel } = usePrivacy();
  const level = levelOf(privacy, account.id);
  return (
    <li className={classes.accountRow} data-level={level}>
      <CardStyleMini cardStyle={account.cardStyle} />
      <span className={classes.accountText}>
        <span className={classes.accountName}>{account.name}</span>
        <span className={classes.accountWhere}>
          {whereOf(account)} {account.currency}
        </span>
      </span>
      <Menu position="bottom-end" shadow="md" width={280}>
        <Menu.Target>
          <UnstyledButton
            className={cx(pills.select, classes.levelPill)}
            data-on={level !== 'Everything' || undefined}
            aria-label={`${account.name}: the family sees ${labelOf(level).toLowerCase()}`}
          >
            <LevelIcon level={level} size={16} />
            <span>{labelOf(level)}</span>
            <IconChevronDown size={16} stroke={1.7} aria-hidden />
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          {LEVELS.map((item) => (
            <Menu.Item
              key={item.value}
              leftSection={<LevelIcon level={item.value} />}
              rightSection={item.value === level ? <IconCheck {...ICON} /> : null}
              onClick={() => {
                setLevel(account.id, item.value);
              }}
            >
              <span className={classes.menuLabel}>{item.label}</span>
              <span className={classes.menuText}>{item.text}</span>
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </li>
  );
}
