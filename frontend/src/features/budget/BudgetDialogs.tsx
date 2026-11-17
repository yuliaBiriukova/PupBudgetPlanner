import { Button, TextInput, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useId, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { currencySign } from '../../shared/format/money';
import pillClasses from '../../shared/ui/Pills.module.css';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import { cx } from '../../shared/ui/cx';
import {
  budgetText,
  moneyIn,
  monthName,
  newOverflows,
  parseBudget,
  withBudget,
  type MonthLines,
  type Overflow,
  type Plan,
} from './budget';
import {
  BudgetRefused,
  useDeletePlan,
  useSetBudget,
  type BudgetTarget,
  type MonthBudgetData,
} from './budgetApi';
import classes from './Budget.module.css';
import { IssueText } from './parts';

const bold = { b: <b /> };

interface DialogProps {
  data: MonthBudgetData;
  lines: MonthLines;
  plan: Plan;
  onClose: () => void;
}

/** What goes over and by how much, in the page's words. */
function useOverflowText(currency: string) {
  const { t } = useTranslation();
  const money = moneyIn(currency);
  return (overflow: Overflow) =>
    overflow.groupId == null
      ? t('budget.dialog.overTotal', {
          inside: money(overflow.inside),
          over: money(overflow.inside - overflow.budget),
          budget: money(overflow.budget),
        })
      : t('budget.dialog.overGroup', {
          inside: money(overflow.inside),
          over: money(overflow.inside - overflow.budget),
          group: overflow.name,
          budget: money(overflow.budget),
        });
}

/**
 * One budget's dialog (a sheet on the phone): its amount, what it sits in and what's inside it. Save is blocked with a
 * red line while the amount doesn't fit; Remove budget takes it away.
 */
export function EditBudgetDialog({
  target,
  data,
  lines,
  plan,
  onClose,
}: DialogProps & { target: BudgetTarget }) {
  const { t } = useTranslation();
  const money = moneyIn(data.currency);
  const overflowText = useOverflowText(data.currency);
  const save = useSetBudget(data.month);
  const group =
    target.kind === 'group'
      ? lines.groups.find((g) => g.id === target.id)
      : target.kind === 'category'
        ? lines.groups.find((g) => g.categories.some((c) => c.id === target.id))
        : undefined;
  const category =
    target.kind === 'category' ? group?.categories.find((c) => c.id === target.id) : undefined;
  const current =
    target.kind === 'total'
      ? plan.total
      : target.kind === 'group'
        ? (plan.groups[target.id] ?? null)
        : (plan.categories[target.id] ?? null);
  const [text, setText] = useState(budgetText(current));
  const [tried, setTried] = useState(false);
  const value = parseBudget(text);
  const issues = newOverflows(plan, withBudget(plan, target, value), data);
  const name =
    target.kind === 'total'
      ? t('budget.dialog.totalTitle', { month: monthName(data.month) })
      : ((category ?? group)?.name ?? '');
  const spent = target.kind === 'total' ? lines.total.spent : ((category ?? group)?.spent ?? 0);
  // The group's other categories' budgets, for how much still fits in this one
  const others = (group?.categories ?? [])
    .filter((c) => c.id !== category?.id)
    .reduce((sum, c) => sum + (c.budget ?? 0), 0);

  const submit = (amount: number | null) => {
    save.mutate({ target, amount }, { onSuccess: onClose });
  };

  return (
    <ResponsiveDialog
      opened
      onClose={onClose}
      title={name}
      footer={
        <div className={classes.dialogButtons}>
          {current != null && (
            <Button
              variant="danger-quiet"
              loading={save.isPending && save.variables.amount == null}
              onClick={() => {
                submit(null);
              }}
            >
              {t('budget.dialog.remove')}
            </Button>
          )}
          <Button variant="quiet" onClick={onClose} className={classes.push}>
            {t('budget.dialog.cancel')}
          </Button>
          <Button
            loading={save.isPending && save.variables.amount != null}
            onClick={() => {
              setTried(true);
              if (issues.length > 0) return;
              submit(value);
            }}
          >
            {t('budget.dialog.save')}
          </Button>
        </div>
      }
    >
      <TextInput
        label={t('budget.dialog.budgetFor', { month: monthName(data.month) })}
        value={text}
        onChange={(event) => {
          setText(budgetText(parseBudget(event.currentTarget.value)));
        }}
        placeholder={
          target.kind === 'group' && group && group.inside > 0
            ? t('budget.dialog.insidePlaceholder', { amount: budgetText(group.inside) })
            : t('budget.dialog.noBudget')
        }
        inputMode="numeric"
        rightSection={currencySign(data.currency)}
        className={classes.amountInput}
        error={(tried && issues.length > 0) || undefined}
        data-autofocus
      />
      {tried &&
        issues.map((issue) => (
          <IssueText key={issue.groupId ?? 'total'}>{overflowText(issue)}</IssueText>
        ))}
      <SaveError error={save.error} />
      <ul className={classes.facts}>
        <li>
          <Trans
            i18nKey="budget.dialog.spentSoFar"
            values={{ amount: money(spent) }}
            components={bold}
          />
        </li>
        {target.kind === 'group' && group && (
          <li>
            <Trans
              i18nKey="budget.dialog.groupInside"
              values={{ amount: money(group.inside) }}
              components={bold}
            />
          </li>
        )}
        {target.kind === 'category' && group && (
          <li>
            {group.own != null ? (
              <Trans
                i18nKey="budget.dialog.fitsInGroup"
                values={{
                  group: group.name,
                  budget: money(group.own),
                  others: money(others),
                  fits: money(Math.max(0, group.own - others)),
                }}
                components={bold}
              />
            ) : (
              t('budget.dialog.onlyTotal', { group: group.name })
            )}
          </li>
        )}
        {target.kind === 'total' && (
          <li>
            <Trans
              i18nKey="budget.dialog.groupsTake"
              values={{ amount: money(lines.planned) }}
              components={bold}
            />
          </li>
        )}
      </ul>
    </ResponsiveDialog>
  );
}

/**
 * "Budget for another … category": the group's categories without a budget as pills, the budget under them, and how
 * much still fits in the group. Save asks for a category first and is blocked, as in the other dialogs, while the
 * amount doesn't fit.
 */
export function NewBudgetDialog({
  groupId,
  categoryId,
  data,
  lines,
  plan,
  onClose,
}: DialogProps & {
  groupId: string;
  /** Picked to begin with (from Spent outside the plan). */ categoryId?: string;
}) {
  const { t } = useTranslation();
  const money = moneyIn(data.currency);
  const overflowText = useOverflowText(data.currency);
  const save = useSetBudget(data.month);
  const [picked, setPicked] = useState<string | null>(categoryId ?? null);
  const [text, setText] = useState('');
  const [tried, setTried] = useState(false);
  const pillsId = useId();
  const group = lines.groups.find((g) => g.id === groupId);
  if (!group) return null;
  const choices = group.categories.filter((c) => c.budget == null);
  const category = choices.find((c) => c.id === picked);
  const value = parseBudget(text);
  const issues = picked
    ? newOverflows(plan, withBudget(plan, { kind: 'category', id: picked }, value), data)
    : [];
  const others = group.categories.reduce((sum, c) => sum + (c.budget ?? 0), 0);

  return (
    <ResponsiveDialog
      opened
      onClose={onClose}
      title={t('budget.dialog.newTitle', { group: group.name })}
      footer={
        <div className={classes.dialogButtons}>
          <Button variant="quiet" onClick={onClose} className={classes.push}>
            {t('budget.dialog.cancel')}
          </Button>
          <Button
            loading={save.isPending}
            onClick={() => {
              setTried(true);
              if (!picked || value == null || issues.length > 0) return;
              save.mutate(
                { target: { kind: 'category', id: picked }, amount: value },
                { onSuccess: onClose },
              );
            }}
          >
            {t('budget.dialog.save')}
          </Button>
        </div>
      }
    >
      <div className={classes.pickHead}>
        <h3 className={classes.pickLabel} id={pillsId}>
          {t('budget.dialog.category')}
        </h3>
        {tried && !picked && (
          <span className={classes.pickError}>
            <IconAlertCircle size={16} stroke={1.7} aria-hidden />
            {t('budget.dialog.pickCategory')}
          </span>
        )}
      </div>
      <div className={pillClasses.pills} role="radiogroup" aria-labelledby={pillsId}>
        {choices.map((c) => (
          <UnstyledButton
            key={c.id}
            role="radio"
            className={pillClasses.pill}
            aria-checked={c.id === picked}
            onClick={() => {
              setPicked(c.id);
            }}
          >
            {c.id === picked && <IconCheck size={16} stroke={1.7} aria-hidden />}
            {c.name}
          </UnstyledButton>
        ))}
      </div>
      <TextInput
        className={cx(classes.amountInput, classes.newField)}
        label={t('budget.dialog.budgetFor', { month: monthName(data.month) })}
        value={text}
        onChange={(event) => {
          setText(budgetText(parseBudget(event.currentTarget.value)));
        }}
        inputMode="numeric"
        rightSection={currencySign(data.currency)}
        error={(tried && (issues.length > 0 || (picked != null && value == null))) || undefined}
      />
      {tried && picked != null && value == null && (
        <IssueText>{t('budget.dialog.typeBudget')}</IssueText>
      )}
      {tried &&
        issues.map((issue) => (
          <IssueText key={issue.groupId ?? 'total'}>{overflowText(issue)}</IssueText>
        ))}
      <SaveError error={save.error} />
      <ul className={classes.facts}>
        {category && (
          <li>
            <Trans
              i18nKey="budget.dialog.categorySpent"
              values={{ category: category.name, amount: money(category.spent) }}
              components={bold}
            />
          </li>
        )}
        <li>
          {group.own != null ? (
            <Trans
              i18nKey="budget.dialog.fitsInNewGroup"
              values={{
                group: group.name,
                budget: money(group.own),
                others: money(others),
                fits: money(Math.max(0, group.own - others)),
              }}
              components={bold}
            />
          ) : (
            t('budget.dialog.onlyTotal', { group: group.name })
          )}
        </li>
      </ul>
    </ResponsiveDialog>
  );
}

/** The API's refusal in its words (the plan changed elsewhere meanwhile), or that it didn't go through. */
function SaveError({ error }: { error: Error | null }) {
  const { t } = useTranslation();
  if (!error) return null;
  return (
    <IssueText>
      {error instanceof BudgetRefused ? error.message : t('budget.dialog.saveError')}
    </IssueText>
  );
}

/**
 * Delete a month's plan (owner's review of PR #115): asks first, says what goes and what stays. After it the month is
 * not planned, and the page offers to start it again.
 */
export function DeletePlanDialog({
  month,
  opened,
  onClose,
}: {
  month: string;
  opened: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeletePlan();
  const name = monthName(month);
  return (
    <ResponsiveDialog
      opened={opened}
      onClose={onClose}
      title={t('budget.deletePlan.title', { month: name })}
      size={400}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            {t('budget.deletePlan.keep')}
          </Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() => {
              // Not mutate's onSuccess: the month comes back not planned and this dialog is gone before it would run
              remove.mutateAsync(month).then(
                () => {
                  onClose();
                  notifications.show({ message: t('budget.deletePlan.done', { month: name }) });
                },
                () => undefined,
              );
            }}
          >
            {t('budget.deletePlan.confirm')}
          </Button>
        </>
      }
    >
      <p className={classes.deleteText}>{t('budget.deletePlan.text', { month: name })}</p>
      {remove.isError && (
        <p className={classes.issue} role="alert">
          {t('budget.deletePlan.error')}
        </p>
      )}
    </ResponsiveDialog>
  );
}
