import { Button, Collapse, Menu, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconChevronDown,
  IconCoins,
  IconEye,
  IconEyeOff,
  IconLock,
  IconPlus,
  IconX,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from '../../shared/ui/cx';
import pills from '../../shared/ui/Pills.module.css';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import { CardStyleMini } from '../accounts/AccountCard';
import { accountsQuery, type Account } from '../accounts/accountsApi';
import tags from '../categories/Categories.module.css';
import { categoriesQuery, type CategoryGroup } from '../categories/categoriesApi';
import settings from '../settings/Settings.module.css';
import type { Family } from './familyApi';
import { ACCOUNT_SHARES, listOf, othersOf, TRANSACTION_SHARES } from './privacy';
import {
  useKeepCategory,
  useShareAccount,
  useShareTransactions,
  type AccountShare,
} from './privacyApi';
import classes from './Privacy.module.css';

const ICON = { size: 20, stroke: 1.7 } as const;

export function ShareIcon({ share, size = 20 }: { share: AccountShare; size?: number }) {
  const Icon = share === 'Hidden' ? IconEyeOff : share === 'BalanceOnly' ? IconCoins : IconEye;
  return <Icon size={size} stroke={1.7} aria-hidden />;
}

/** Says a change didn't go through; the section already shows what the server has again. */
function useFailed() {
  const { t } = useTranslation();
  return () => notifications.show({ color: 'red', message: t('privacy.failed') });
}

/**
 * "What the family sees" on the Family page (F-030, final prototype: variant 1 "Rows", folding): your transactions,
 * your accounts and your private categories as three rows, each with what is set now; a tap unfolds it to change it.
 * They start folded; several can be open. Shown while someone else is in the family.
 */
export function PrivacySection({ family }: { family: Family }) {
  const { t, i18n } = useTranslation();
  const others = othersOf(family.members);
  const seers = listOf(
    others.map((member) => member.displayName),
    i18n.language,
  );
  const me = family.members.find((member) => member.isYou);
  const accounts = useQuery(accountsQuery);
  const categories = useQuery(categoriesQuery);
  const [picking, setPicking] = useState(false);

  const inUse = accounts.data?.accounts ?? [];
  const groups = categories.data?.groups ?? [];
  const count = (share: AccountShare) =>
    inUse.filter((account) => account.familySees === share).length;
  const hidden = count('Hidden');
  const balance = count('BalanceOnly');
  const shared = inUse.length - hidden - balance;
  const accountsSummary =
    inUse.length === 0
      ? t('privacy.accounts.none')
      : shared === inUse.length
        ? t('privacy.accounts.all', { count: inUse.length })
        : [
            shared > 0 && t('privacy.accounts.shared', { count: shared }),
            balance > 0 && t('privacy.accounts.balance', { count: balance }),
            hidden > 0 && t('privacy.accounts.hidden', { count: hidden }),
          ]
            .filter(Boolean)
            .join(', ');
  const kept = groups.flatMap((group) => group.categories.filter((category) => category.isPrivate));
  const categoriesSummary =
    kept.length === 0
      ? t('privacy.categories.none')
      : kept.length <= 2
        ? kept.map((category) => category.name).join(', ')
        : t('privacy.categories.many', { count: kept.length });
  const lines = me?.transactions ?? 'Every';

  return (
    <section className={settings.section}>
      <div>
        <h2 className={settings.title}>{t('privacy.title')}</h2>
        <div className={settings.text}>
          {t('privacy.text', { names: seers, count: others.length })}
        </div>
      </div>
      <div className={settings.control}>
        <div className={classes.folds}>
          <Fold
            title={t('privacy.transactions.title')}
            summary={t(`privacy.transactions.${lines}`)}
          >
            <TransactionsChoice value={lines} />
          </Fold>
          <Fold title={t('privacy.accounts.title')} summary={accountsSummary}>
            {inUse.length > 0 && (
              <ul className={classes.accountRows}>
                {inUse.map((account) => (
                  <AccountRow key={account.id} account={account} />
                ))}
              </ul>
            )}
          </Fold>
          <Fold title={t('privacy.categories.title')} summary={categoriesSummary}>
            <p className={classes.quiet}>
              {t('privacy.categories.text', { names: seers, count: others.length })}
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
                {t('privacy.categories.choose')}
              </UnstyledButton>
            </div>
          </Fold>
        </div>
      </div>
      <CategoriesDialog
        opened={picking}
        groups={groups}
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

/** Every transaction or only the totals: two rows to pick from, each with a line on what it means. */
function TransactionsChoice({ value }: { value: string }) {
  const { t } = useTranslation();
  const share = useShareTransactions();
  const failed = useFailed();
  return (
    <div
      role="radiogroup"
      aria-label={t('privacy.transactions.label')}
      className={classes.choiceRows}
      data-plain
    >
      {TRANSACTION_SHARES.map((item) => {
        const checked = value === item;
        return (
          <UnstyledButton
            key={item}
            role="radio"
            aria-checked={checked}
            className={classes.choiceRow}
            onClick={() => {
              if (!checked) share.mutate(item, { onError: failed });
            }}
          >
            <span className={classes.radioDot} aria-hidden="true">
              {checked && <IconCheck size={14} stroke={2.4} />}
            </span>
            <span>
              <span className={classes.choiceTitle}>{t(`privacy.transactions.${item}`)}</span>
              <span className={classes.choiceText}>{t(`privacy.transactions.${item}Text`)}</span>
            </span>
          </UnstyledButton>
        );
      })}
    </div>
  );
}

/** Where an account's money is: its bank, its own source, or Cash. */
function useWhereOf() {
  const { t } = useTranslation();
  return (account: Account) => account.bankName ?? account.sourceName ?? t('accounts.cash');
}

/** One account: its style, name and bank; on the right its share, a pill opening the three. */
function AccountRow({ account }: { account: Account }) {
  const { t } = useTranslation();
  const share = useShareAccount();
  const failed = useFailed();
  const whereOf = useWhereOf();
  const level = account.familySees;
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
            aria-label={t('privacy.accounts.level', {
              name: account.name,
              level: t(`privacy.shares.${level}`).toLowerCase(),
            })}
          >
            <ShareIcon share={level} size={16} />
            <span>{t(`privacy.shares.${level}`)}</span>
            <IconChevronDown size={16} stroke={1.7} aria-hidden />
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          {ACCOUNT_SHARES.map((item) => (
            <Menu.Item
              key={item}
              leftSection={<ShareIcon share={item} />}
              rightSection={item === level ? <IconCheck {...ICON} /> : null}
              onClick={() => {
                if (item !== level)
                  share.mutate({ accountId: account.id, share: item }, { onError: failed });
              }}
            >
              <span className={classes.menuLabel}>{t(`privacy.shares.${item}`)}</span>
              <span className={classes.menuText}>{t(`privacy.shares.${item}Text`)}</span>
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </li>
  );
}

/** The private categories as tags, each with an × that shares it again. */
function PrivateTags({ groups }: { groups: CategoryGroup[] }) {
  const { t } = useTranslation();
  const keep = useKeepCategory();
  const failed = useFailed();
  const kept = groups.flatMap((group) =>
    group.categories
      .filter((category) => category.isPrivate)
      .map((category) => ({ ...category, group: group.name })),
  );
  if (kept.length === 0) return null;
  return (
    <ul className={tags.tags}>
      {kept.map((category) => (
        <li key={category.id}>
          <span className={cx(tags.tag, classes.privateTag)}>
            <IconLock size={16} stroke={1.7} aria-hidden />
            {category.name}
            <span className={classes.tagGroup}>{category.group}</span>
            <UnstyledButton
              className={classes.tagX}
              aria-label={t('privacy.categories.shareAgain', {
                name: category.name,
                group: category.group,
              })}
              onClick={() => {
                keep.mutate({ categoryId: category.id, isPrivate: false }, { onError: failed });
              }}
            >
              <IconX size={16} stroke={1.7} aria-hidden />
            </UnstyledButton>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Every shown category by group as pills: a picked one is private, with a lock. */
function CategoriesDialog({
  opened,
  onClose,
  groups,
  seers,
}: {
  opened: boolean;
  onClose: () => void;
  groups: CategoryGroup[];
  seers: string;
}) {
  const { t } = useTranslation();
  const keep = useKeepCategory();
  const failed = useFailed();
  return (
    <ResponsiveDialog
      opened={opened}
      onClose={onClose}
      title={t('privacy.categories.title')}
      size={560}
      footer={<Button onClick={onClose}>{t('privacy.categories.done')}</Button>}
    >
      <p className={classes.dialogLead}>{t('privacy.categories.lead', { names: seers })}</p>
      {groups
        .filter((group) => !group.isHidden)
        .map((group) => (
          <section key={group.id} className={classes.pickGroup}>
            <h3 className={classes.pickGroupName}>{group.name}</h3>
            <div className={pills.pills}>
              {group.categories
                .filter((category) => !category.isHidden)
                .map((category) => (
                  <UnstyledButton
                    key={category.id}
                    className={pills.pill}
                    aria-pressed={category.isPrivate}
                    onClick={() => {
                      keep.mutate(
                        { categoryId: category.id, isPrivate: !category.isPrivate },
                        { onError: failed },
                      );
                    }}
                  >
                    {category.isPrivate && <IconLock size={16} stroke={1.7} aria-hidden />}
                    {category.name}
                  </UnstyledButton>
                ))}
            </div>
          </section>
        ))}
    </ResponsiveDialog>
  );
}
