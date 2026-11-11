import { Button, TextInput, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEye, IconEyeOff, IconInfoCircle, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import pills from '../../shared/ui/Pills.module.css';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import { useDesktopAutofocus } from '../../shared/ui/useDesktopAutofocus';
import {
  CategoryNameError,
  useRemoveCategory,
  useRestoreCategory,
  useSaveCategory,
  type Category,
  type CategoryGroup,
} from './categoriesApi';
import classes from './CategorySheets.module.css';
import {
  checkCategoryName,
  findCategory,
  groupsOf,
  removeOutcome,
  shownOf,
  type NameCheck,
} from './categoryRules';
import { PlaceList } from './PlaceList';

/** A category to change, or a new one in a group. */
export type CategoryTarget = { categoryId: string } | { newIn: string };

const MAX_NAME = 50;

/** The name's mistake under the field, with "Show it again" when a hidden category has the name. */
function NameError({
  check,
  group,
  onShowTwin,
}: {
  check: Exclude<NameCheck, { ok: true }>;
  group: CategoryGroup;
  onShowTwin: (twin: Category) => void;
}) {
  const { t } = useTranslation();
  if (check.error === 'empty') return <>{t('categories.names.empty')}</>;
  if (check.error === 'taken')
    return <>{t('categories.names.taken', { name: check.twin, group: group.name })}</>;
  return (
    <>
      {t('categories.names.takenHidden', { name: check.twin.name, group: group.name })}
      {'. '}
      <UnstyledButton
        className={classes.twin}
        onClick={() => {
          onShowTwin(check.twin);
        }}
      >
        {t('categories.names.showItAgain')}
      </UnstyledButton>
    </>
  );
}

/**
 * A category's own sheet (F-029, a dialog on the desktop): its name, its group (of its kind), its place in the group,
 * and Hide or Delete at the end, asked again in the same sheet. A hidden one's sheet says it keeps its transactions,
 * with Show again. A new one starts at the end of the group it was added to.
 */
export function CategorySheet({
  target,
  groups,
  onClose,
}: {
  target: CategoryTarget;
  groups: CategoryGroup[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  // As it was when the sheet opened: it stays so while the page fetches the change and the sheet closes
  const [found] = useState(() =>
    'categoryId' in target ? findCategory(groups, target.categoryId) : undefined,
  );
  const startGroup = found?.group ?? groups.find((g) => 'newIn' in target && g.id === target.newIn);
  const selfId = found?.category.id;
  const othersIn = (g: CategoryGroup | undefined) =>
    g ? shownOf(g).filter((c) => c.id !== selfId) : [];

  const [name, setName] = useState(found?.category.name ?? '');
  const [groupId, setGroupId] = useState(startGroup?.id ?? '');
  const [place, setPlace] = useState(() => {
    const at = startGroup ? shownOf(startGroup).findIndex((c) => c.id === selfId) : -1;
    return at >= 0 ? at : othersIn(startGroup).length;
  });
  const [tried, setTried] = useState(false);
  const [asking, setAsking] = useState(false);
  const autofocus = useDesktopAutofocus();
  const save = useSaveCategory();
  const remove = useRemoveCategory();
  const restore = useRestoreCategory();

  const group = groups.find((g) => g.id === groupId);
  if (!group) return null;
  const category = found?.category;
  const busy = save.isPending || remove.isPending || restore.isPending;
  const failed =
    (save.isError && !(save.error instanceof CategoryNameError)) ||
    remove.isError ||
    restore.isError;
  const error = failed ? (
    <p className={classes.formError} role="alert">
      {t('categories.errors.save')}
    </p>
  ) : null;

  const showAgain = (shown: Category, inGroup: CategoryGroup) => {
    restore.mutate(shown.id, {
      onSuccess: () => {
        notifications.show({
          message: t('categories.done.back', { name: shown.name, group: inGroup.name }),
        });
        onClose();
      },
    });
  };

  // A hidden category: what it keeps, and Show again
  if (category?.isHidden) {
    return (
      <ResponsiveDialog
        opened
        onClose={onClose}
        title={t('categories.sheet.hiddenTitle', { name: category.name })}
        footer={
          <>
            <Button variant="quiet" onClick={onClose}>
              {t('categories.sheet.close')}
            </Button>
            <Button
              leftSection={<IconEye size={20} stroke={1.7} />}
              loading={restore.isPending}
              onClick={() => {
                showAgain(category, group);
              }}
            >
              {t('categories.sheet.showAgain')}
            </Button>
          </>
        }
      >
        <p className={classes.dialogText}>
          {t('categories.sheet.hiddenText', {
            count: category.transactionCount,
            group: group.name,
          })}
        </p>
        {error}
      </ResponsiveDialog>
    );
  }

  // Hide or Delete, asked again in the same sheet
  if (category && asking) {
    const hide = removeOutcome(category) === 'hide';
    return (
      <ResponsiveDialog
        opened
        onClose={onClose}
        title={t(hide ? 'categories.sheet.askHide' : 'categories.sheet.askDelete', {
          name: category.name,
        })}
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
              variant={hide ? undefined : 'danger'}
              loading={remove.isPending}
              leftSection={
                hide ? <IconEyeOff size={20} stroke={1.7} /> : <IconTrash size={20} stroke={1.7} />
              }
              onClick={() => {
                remove.mutate(category.id, {
                  onSuccess: (removal) => {
                    notifications.show({
                      message: t(
                        removal === 'Deleted'
                          ? 'categories.done.deleted'
                          : 'categories.done.hidden',
                        { name: category.name },
                      ),
                    });
                    onClose();
                  },
                });
              }}
            >
              {t(hide ? 'categories.sheet.hide' : 'categories.sheet.delete')}
            </Button>
          </>
        }
      >
        {hide ? (
          <>
            <p className={classes.dialogText}>
              {t('categories.sheet.hideWhy', { count: category.transactionCount })}
            </p>
            <div className={classes.facts}>
              <IconInfoCircle size={20} stroke={1.7} aria-hidden />
              <p>{t('categories.sheet.hideFacts')}</p>
            </div>
          </>
        ) : (
          <p className={classes.dialogText}>{t('categories.sheet.deleteText')}</p>
        )}
        {error}
      </ResponsiveDialog>
    );
  }

  const check = checkCategoryName(name, group, selfId);
  // A clash shows as soon as it's typed; an empty name only after Save
  const showCheck = !check.ok && (tried || check.error !== 'empty');
  const taken = save.error instanceof CategoryNameError;

  const submit = () => {
    setTried(true);
    if (!check.ok || busy) return;
    const clean = name.trim();
    save.mutate(
      { id: category?.id, groupId: group.id, name: clean, place },
      {
        onSuccess: () => {
          const moved = category && found.group.id !== group.id;
          notifications.show({
            message: !category
              ? t('categories.done.added', { name: clean })
              : moved
                ? t('categories.done.moved', { name: clean, group: group.name })
                : t('categories.done.saved', { name: clean }),
          });
          onClose();
        },
      },
    );
  };
  const hide = category ? removeOutcome(category) === 'hide' : false;

  return (
    <ResponsiveDialog
      opened
      onClose={onClose}
      title={t(category ? 'categories.sheet.editCategory' : 'categories.sheet.newCategory')}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            {t('categories.sheet.cancel')}
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            {t(category ? 'categories.sheet.save' : 'categories.sheet.add')}
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
          showCheck ? (
            <NameError
              check={check}
              group={group}
              onShowTwin={(twin) => {
                showAgain(twin, group);
              }}
            />
          ) : taken ? (
            t('categories.names.taken', { name: name.trim(), group: group.name })
          ) : undefined
        }
      />
      <div className={classes.field}>
        <span className={classes.fieldLabel} id="category-group-label">
          {t('categories.sheet.group')}
        </span>
        <div className={pills.pills} role="radiogroup" aria-labelledby="category-group-label">
          {groupsOf(groups, group.kind).map((g) => (
            <UnstyledButton
              key={g.id}
              className={pills.pill}
              role="radio"
              aria-checked={g.id === group.id}
              onClick={() => {
                if (g.id === group.id) return;
                setGroupId(g.id);
                setPlace(othersIn(g).length);
                if (taken) save.reset();
              }}
            >
              {g.name}
            </UnstyledButton>
          ))}
        </div>
      </div>
      <PlaceList
        label={t('categories.sheet.placeIn', { group: group.name })}
        names={othersIn(group)}
        current={name.trim() || t('categories.sheet.newCategory')}
        place={place}
        setPlace={setPlace}
      />
      {category && (
        <div className={classes.removeRow}>
          <div>
            <p className={classes.removeTitle}>
              {t(hide ? 'categories.sheet.hideCategory' : 'categories.sheet.deleteCategory')}
            </p>
            <p className={classes.removeText}>
              {hide
                ? t('categories.sheet.hideWhy', { count: category.transactionCount })
                : t('categories.sheet.deleteWhy')}
            </p>
          </div>
          <Button
            variant={hide ? 'quiet' : 'danger-quiet'}
            leftSection={
              hide ? <IconEyeOff size={20} stroke={1.7} /> : <IconTrash size={20} stroke={1.7} />
            }
            onClick={() => {
              setAsking(true);
            }}
          >
            {t(hide ? 'categories.sheet.hide' : 'categories.sheet.delete')}
          </Button>
        </div>
      )}
      {error}
    </ResponsiveDialog>
  );
}
