import { Button, TextInput, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEyeOff, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import pills from '../../shared/ui/Pills.module.css';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import { useDesktopAutofocus } from '../../shared/ui/useDesktopAutofocus';
import {
  CategoryNameError,
  useRemoveGroup,
  useSaveGroup,
  type CategoryGroup,
  type CategoryKind,
} from './categoriesApi';
import classes from './CategorySheets.module.css';
import { checkGroupName, groupRemoval, groupsOf } from './categoryRules';
import { PlaceList } from './PlaceList';

/** A group to change, or a new one of a kind. */
export type GroupTarget = { groupId: string } | { newKind: CategoryKind };

const MAX_NAME = 50;
const KINDS: readonly CategoryKind[] = ['Income', 'Expense'];

/** What removing a group does, or why it can't go yet. */
function RemoveGroupText({ group, groups }: { group: CategoryGroup; groups: CategoryGroup[] }) {
  const { t } = useTranslation();
  const removal = groupRemoval(group, groups);
  return (
    <p className={classes.dialogText}>
      {'cannot' in removal
        ? removal.cannot === 'last'
          ? t(`categories.sheet.groupLast.${group.kind}`)
          : t('categories.sheet.groupInUse', { count: removal.shown })
        : t(
            removal.can === 'delete'
              ? 'categories.sheet.groupDelete'
              : 'categories.sheet.groupHide',
          )}
    </p>
  );
}

/**
 * A group's sheet (F-029): its name (and kind when new), its place among the groups of its kind, and at the end
 * Delete or Hide when it can go, otherwise why not. A new group starts at the end of its kind.
 */
export function GroupSheet({
  target,
  groups,
  onClose,
}: {
  target: GroupTarget;
  groups: CategoryGroup[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  // As it was when the sheet opened: it stays so while the page fetches the change and the sheet closes
  const [group] = useState(() =>
    'groupId' in target ? groups.find((g) => g.id === target.groupId) : undefined,
  );
  const [kind, setKind] = useState<CategoryKind>(
    group?.kind ?? ('newKind' in target ? target.newKind : 'Expense'),
  );
  const others = groupsOf(groups, kind).filter((g) => g.id !== group?.id);
  const [name, setName] = useState(group?.name ?? '');
  const [place, setPlace] = useState(() => {
    const at = group ? groupsOf(groups, group.kind).findIndex((g) => g.id === group.id) : -1;
    return at >= 0 ? at : others.length;
  });
  const [tried, setTried] = useState(false);
  const [asking, setAsking] = useState(false);
  const autofocus = useDesktopAutofocus();
  const save = useSaveGroup();
  const remove = useRemoveGroup();

  const removal = group ? groupRemoval(group, groups) : undefined;
  const can = removal && 'can' in removal ? removal.can : undefined;
  const error =
    (save.isError && !(save.error instanceof CategoryNameError)) || remove.isError ? (
      <p className={classes.formError} role="alert">
        {t('categories.errors.save')}
      </p>
    ) : null;

  if (group && asking && can) {
    const icon =
      can === 'delete' ? (
        <IconTrash size={20} stroke={1.7} />
      ) : (
        <IconEyeOff size={20} stroke={1.7} />
      );
    return (
      <ResponsiveDialog
        opened
        onClose={onClose}
        title={t(
          can === 'delete' ? 'categories.sheet.askDeleteGroup' : 'categories.sheet.askHideGroup',
          { name: group.name },
        )}
        footer={
          <>
            <Button
              variant="quiet"
              onClick={() => {
                setAsking(false);
              }}
            >
              {t('categories.sheet.keep')}
            </Button>
            <Button
              variant={can === 'delete' ? 'danger' : undefined}
              leftSection={icon}
              loading={remove.isPending}
              onClick={() => {
                remove.mutate(group.id, {
                  onSuccess: (done) => {
                    notifications.show({
                      message: t(
                        done === 'Deleted'
                          ? 'categories.done.groupDeleted'
                          : 'categories.done.groupHidden',
                        { name: group.name },
                      ),
                    });
                    onClose();
                  },
                });
              }}
            >
              {t(can === 'delete' ? 'categories.sheet.delete' : 'categories.sheet.hide')}
            </Button>
          </>
        }
      >
        <RemoveGroupText group={group} groups={groups} />
        {error}
      </ResponsiveDialog>
    );
  }

  const check = checkGroupName(name, groups, group?.id);
  const showCheck = !check.ok && (tried || check.error !== 'empty');
  const taken = save.error instanceof CategoryNameError;

  const submit = () => {
    setTried(true);
    if (!check.ok || save.isPending) return;
    const clean = name.trim();
    save.mutate(
      { id: group?.id, kind, name: clean, place },
      {
        onSuccess: () => {
          notifications.show({
            message: t(group ? 'categories.done.groupSaved' : 'categories.done.groupAdded', {
              name: clean,
            }),
          });
          onClose();
        },
      },
    );
  };

  return (
    <ResponsiveDialog
      opened
      onClose={onClose}
      title={t(group ? 'categories.sheet.editGroup' : 'categories.sheet.newGroup')}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            {t('categories.sheet.cancel')}
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            {t(group ? 'categories.sheet.save' : 'categories.sheet.add')}
          </Button>
        </>
      }
    >
      <TextInput
        label={t('categories.sheet.name')}
        value={name}
        maxLength={MAX_NAME}
        data-autofocus={autofocus}
        onChange={(event) => {
          setName(event.currentTarget.value);
          if (taken) save.reset();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') submit();
        }}
        error={
          showCheck
            ? check.error === 'taken'
              ? t('categories.names.groupTaken', { name: check.twin })
              : t('categories.names.empty')
            : taken
              ? t('categories.names.groupTaken', { name: name.trim() })
              : undefined
        }
      />
      {!group && (
        <div className={classes.field}>
          <span className={classes.fieldLabel} id="group-kind-label">
            {t('categories.sheet.kind')}
          </span>
          <div className={pills.pills} role="radiogroup" aria-labelledby="group-kind-label">
            {KINDS.map((k) => (
              <UnstyledButton
                key={k}
                className={pills.pill}
                role="radio"
                aria-checked={k === kind}
                onClick={() => {
                  setKind(k);
                  setPlace(groupsOf(groups, k).length);
                }}
              >
                {t(`categories.kind.${k}`)}
              </UnstyledButton>
            ))}
          </div>
        </div>
      )}
      <PlaceList
        label={t(`categories.sheet.placeAmong.${kind}`)}
        names={others}
        current={name.trim() || t('categories.sheet.newGroup')}
        place={place}
        setPlace={setPlace}
      />
      {group && (
        <div className={classes.removeRow}>
          <div>
            <p className={classes.removeTitle}>{t('categories.sheet.removeGroup')}</p>
            <div className={classes.removeText}>
              <RemoveGroupText group={group} groups={groups} />
            </div>
          </div>
          {can && (
            <Button
              variant={can === 'delete' ? 'danger-quiet' : 'quiet'}
              leftSection={
                can === 'delete' ? (
                  <IconTrash size={20} stroke={1.7} />
                ) : (
                  <IconEyeOff size={20} stroke={1.7} />
                )
              }
              onClick={() => {
                setAsking(true);
              }}
            >
              {t(can === 'delete' ? 'categories.sheet.delete' : 'categories.sheet.hide')}
            </Button>
          )}
        </div>
      )}
      {error}
    </ResponsiveDialog>
  );
}
