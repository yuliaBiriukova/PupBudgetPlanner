import { ActionIcon, Button, TextInput, Title, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconArrowDown,
  IconArrowUp,
  IconEye,
  IconEyeOff,
  IconGripVertical,
  IconPencil,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';
import type { CategoryKind } from '../../features/categories/categoriesApi';
import classes from '../../features/categories/Categories.module.css';
import { cx } from '../../shared/ui/cx';
import pills from '../../shared/ui/Pills.module.css';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import { useDesktopAutofocus } from '../../shared/ui/useDesktopAutofocus';
import { HiddenRow, RemoveCategoryText, RemoveGroupText } from './parts';
import type { ProtoGroup } from './protoData';
import proto from './Proto.module.css';
import { ReadView, WIDE_QUERY } from './ReadView';
import { useDragToSlot } from './useDragToSlot';
import {
  checkCategoryName,
  checkGroupName,
  groupRemoval,
  groupsOf,
  hiddenOf,
  removeOutcome,
  shownOf,
  useCategoryEdits,
  type CategoryEdits,
} from './useCategoryEdits';

type CategoryTarget = { categoryId: string } | { newIn: string };
type GroupTarget = { groupId: string } | { newKind: CategoryKind };

const plural = (n: number, one: string, many: string) => `${String(n)} ${n === 1 ? one : many}`;

/**
 * Where the thing being changed sits in its list: the others in order with it marked among them. Its grip drags it,
 * the arrows move it one place, both by touch and with the keyboard.
 */
function PlaceList({
  label,
  names,
  current,
  place,
  setPlace,
}: {
  label: string;
  names: { id: string; name: string }[];
  current: string;
  place: number;
  setPlace: (place: number) => void;
}) {
  const { containerRef, drag, gripProps, rowProps } = useDragToSlot<HTMLOListElement>({
    anchors: '[data-drag-row="place"]',
    onDrop: (_, slot) => {
      setPlace(slot);
    },
  });
  const rows = [...names];
  rows.splice(place, 0, { id: '', name: current });
  // Nothing to place it among: no list
  if (names.length === 0) return null;

  return (
    <div className={proto.place}>
      <div className={proto.placeHead}>
        <span className={proto.fieldLabel}>{label}</span>
        <span className={proto.placeButtons}>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={`Move “${current}” up`}
            disabled={place === 0}
            onClick={() => {
              setPlace(place - 1);
            }}
          >
            <IconArrowUp size={20} stroke={1.7} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={`Move “${current}” down`}
            disabled={place >= names.length}
            onClick={() => {
              setPlace(place + 1);
            }}
          >
            <IconArrowDown size={20} stroke={1.7} />
          </ActionIcon>
        </span>
      </div>
      <ol ref={containerRef} className={proto.placeList} aria-label={label}>
        {rows.map((row) =>
          row.id === '' ? (
            <li
              key="current"
              {...rowProps('current', 'self')}
              className={proto.placeCurrent}
              aria-current="true"
            >
              <span className={proto.grip} {...gripProps('current')} aria-hidden>
                <IconGripVertical size={20} stroke={1.7} />
              </span>
              <span className={proto.name}>{row.name}</span>
            </li>
          ) : (
            <li key={row.id} data-drag-row="place" className={proto.placeRow}>
              {row.name}
            </li>
          ),
        )}
        {drag && <li className={proto.dropLine} style={{ top: drag.line }} aria-hidden />}
      </ol>
    </div>
  );
}

/** A category's own sheet: its name, its group, its place in the group, and Hide or Delete at the end. */
function CategorySheet({
  target,
  edits,
  onClose,
}: {
  target: CategoryTarget;
  edits: CategoryEdits;
  onClose: () => void;
}) {
  const found = 'categoryId' in target ? edits.find(target.categoryId) : undefined;
  const startGroup =
    found?.group ?? edits.groups.find((g) => 'newIn' in target && g.id === target.newIn);
  const selfId = found?.category.id;
  const [name, setName] = useState(found?.category.name ?? '');
  const [groupId, setGroupId] = useState(startGroup?.id ?? '');
  const othersIn = (g: ProtoGroup | undefined) =>
    g ? shownOf(g).filter((c) => c.id !== selfId) : [];
  const [place, setPlace] = useState(() => {
    const at = startGroup ? shownOf(startGroup).findIndex((c) => c.id === selfId) : -1;
    return at >= 0 ? at : othersIn(startGroup).length;
  });
  const [tried, setTried] = useState(false);
  const [asking, setAsking] = useState(false);
  const autofocus = useDesktopAutofocus();
  const group = edits.groups.find((g) => g.id === groupId);
  if (!group) return null;
  const check = checkCategoryName(name, group, selfId);
  const showError = tried || name.trim() !== '';
  const category = found?.category;

  // A hidden category: what it is and Show again
  if (category?.hidden) {
    return (
      <ResponsiveDialog
        opened
        onClose={onClose}
        title={`“${category.name}” is hidden`}
        footer={
          <>
            <Button variant="quiet" onClick={onClose}>
              Close
            </Button>
            <Button
              leftSection={<IconEye size={20} stroke={1.7} />}
              onClick={() => {
                edits.restoreCategory(category.id);
                onClose();
              }}
            >
              Show again
            </Button>
          </>
        }
      >
        <p className={proto.dialogText}>
          It has {plural(category.used, 'transaction', 'transactions')} and keeps them. You don’t
          see it when you add a transaction; shown again, it’s back at the end of {group.name}.
        </p>
      </ResponsiveDialog>
    );
  }

  if (category && asking) {
    const hide = removeOutcome(category) === 'hide';
    return (
      <ResponsiveDialog
        opened
        onClose={onClose}
        title={`${hide ? 'Hide' : 'Delete'} “${category.name}”?`}
        footer={
          <>
            <Button
              variant="quiet"
              onClick={() => {
                setAsking(false);
              }}
            >
              Keep it
            </Button>
            <Button
              variant={hide ? undefined : 'danger'}
              leftSection={
                hide ? <IconEyeOff size={20} stroke={1.7} /> : <IconTrash size={20} stroke={1.7} />
              }
              onClick={() => {
                edits.removeCategory(category.id);
                onClose();
              }}
            >
              {hide ? 'Hide' : 'Delete'}
            </Button>
          </>
        }
      >
        <RemoveCategoryText category={category} />
      </ResponsiveDialog>
    );
  }

  const save = () => {
    setTried(true);
    if (!check.ok) return;
    if (!category) {
      edits.addCategory(group.id, name, place);
    } else {
      if (name.trim() !== category.name) edits.renameCategory(category.id, name);
      const at = shownOf(group).findIndex((c) => c.id === category.id);
      if (group.id !== found.group.id || at !== place)
        edits.moveCategory(category.id, group.id, place);
      if (group.id === found.group.id)
        notifications.show({ message: `“${name.trim()}” saved`, autoClose: 2500 });
    }
    onClose();
  };
  const sameKind = groupsOf(edits.groups, group.kind);
  const hide = category ? removeOutcome(category) === 'hide' : false;

  return (
    <ResponsiveDialog
      opened
      onClose={onClose}
      title={category ? 'Edit category' : 'New category'}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{category ? 'Save' : 'Add'}</Button>
        </>
      }
    >
      <TextInput
        label="Name"
        value={name}
        data-autofocus={autofocus}
        onChange={(event) => {
          setName(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') save();
        }}
        error={
          showError && !check.ok ? (
            <>
              {check.error}
              {check.hiddenTwin && (
                <>
                  {'. '}
                  <UnstyledButton
                    className={proto.twin}
                    onClick={() => {
                      if (check.hiddenTwin) edits.restoreCategory(check.hiddenTwin.id);
                      onClose();
                    }}
                  >
                    Show it again
                  </UnstyledButton>
                </>
              )}
            </>
          ) : undefined
        }
      />
      <div className={proto.field}>
        <span className={proto.fieldLabel} id="category-group-label">
          Group
        </span>
        <div className={pills.pills} role="radiogroup" aria-labelledby="category-group-label">
          {sameKind.map((g) => (
            <UnstyledButton
              key={g.id}
              className={pills.pill}
              role="radio"
              aria-checked={g.id === group.id}
              onClick={() => {
                if (g.id === group.id) return;
                setGroupId(g.id);
                setPlace(othersIn(g).length);
              }}
            >
              {g.name}
            </UnstyledButton>
          ))}
        </div>
      </div>
      <PlaceList
        label={`Place in ${group.name}`}
        names={othersIn(group)}
        current={name.trim() || 'New category'}
        place={place}
        setPlace={setPlace}
      />
      {category && (
        <div className={proto.removeRow}>
          <div>
            <p className={proto.removeTitle}>
              {hide ? 'Hide this category' : 'Delete this category'}
            </p>
            <p className={proto.removeText}>
              {hide
                ? `It has ${plural(category.used, 'transaction', 'transactions')}, so it’s hidden, not deleted.`
                : 'It has no transactions, so it’s deleted for good.'}
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
            {hide ? 'Hide' : 'Delete'}
          </Button>
        </div>
      )}
    </ResponsiveDialog>
  );
}

/** A group's sheet: its name (and kind when new), its place among the groups of its kind, and Remove at the end. */
function GroupSheet({
  target,
  edits,
  onClose,
}: {
  target: GroupTarget;
  edits: CategoryEdits;
  onClose: () => void;
}) {
  const group = 'groupId' in target ? edits.groups.find((g) => g.id === target.groupId) : undefined;
  const [kind, setKind] = useState<CategoryKind>(
    group?.kind ?? ('newKind' in target ? target.newKind : 'Expense'),
  );
  const others = groupsOf(edits.groups, kind).filter((g) => g.id !== group?.id);
  const [name, setName] = useState(group?.name ?? '');
  const [place, setPlace] = useState(() => {
    const at = group ? groupsOf(edits.groups, group.kind).findIndex((g) => g.id === group.id) : -1;
    return at >= 0 ? at : others.length;
  });
  const [tried, setTried] = useState(false);
  const [asking, setAsking] = useState(false);
  const autofocus = useDesktopAutofocus();
  const check = checkGroupName(name, edits.groups, group?.id);
  const showError = tried || name.trim() !== '';
  const removal = group ? groupRemoval(group, edits.groups) : undefined;
  const can = removal && 'can' in removal ? removal.can : undefined;

  if (group && asking && can) {
    return (
      <ResponsiveDialog
        opened
        onClose={onClose}
        title={`${can === 'delete' ? 'Delete' : 'Hide'} the group “${group.name}”?`}
        footer={
          <>
            <Button
              variant="quiet"
              onClick={() => {
                setAsking(false);
              }}
            >
              Keep it
            </Button>
            <Button
              variant={can === 'delete' ? 'danger' : undefined}
              leftSection={
                can === 'delete' ? (
                  <IconTrash size={20} stroke={1.7} />
                ) : (
                  <IconEyeOff size={20} stroke={1.7} />
                )
              }
              onClick={() => {
                edits.removeGroup(group.id);
                onClose();
              }}
            >
              {can === 'delete' ? 'Delete' : 'Hide'}
            </Button>
          </>
        }
      >
        <RemoveGroupText group={group} groups={edits.groups} />
      </ResponsiveDialog>
    );
  }

  const save = () => {
    setTried(true);
    if (!check.ok) return;
    if (!group) {
      const id = edits.addGroup(kind, name);
      if (place < others.length) edits.moveGroup(id, place);
    } else {
      if (name.trim() !== group.name) edits.renameGroup(group.id, name);
      const at = groupsOf(edits.groups, group.kind).findIndex((g) => g.id === group.id);
      if (at !== place) edits.moveGroup(group.id, place);
      notifications.show({ message: `Group “${name.trim()}” saved`, autoClose: 2500 });
    }
    onClose();
  };

  return (
    <ResponsiveDialog
      opened
      onClose={onClose}
      title={group ? 'Edit group' : 'New group'}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{group ? 'Save' : 'Add'}</Button>
        </>
      }
    >
      <TextInput
        label="Name"
        value={name}
        data-autofocus={autofocus}
        onChange={(event) => {
          setName(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') save();
        }}
        error={showError && !check.ok ? check.error : undefined}
      />
      {!group && (
        <div className={proto.field}>
          <span className={proto.fieldLabel} id="group-kind-label">
            For
          </span>
          <div className={pills.pills} role="radiogroup" aria-labelledby="group-kind-label">
            {(['Income', 'Expense'] as const).map((k) => (
              <UnstyledButton
                key={k}
                className={pills.pill}
                role="radio"
                aria-checked={k === kind}
                onClick={() => {
                  setKind(k);
                  setPlace(groupsOf(edits.groups, k).length);
                }}
              >
                {k === 'Income' ? 'Income' : 'Expenses'}
              </UnstyledButton>
            ))}
          </div>
        </div>
      )}
      <PlaceList
        label={kind === 'Income' ? 'Place among income groups' : 'Place among expense groups'}
        names={others}
        current={name.trim() || 'New group'}
        place={place}
        setPlace={setPlace}
      />
      {group && (
        <div className={proto.removeRow}>
          <div>
            <p className={proto.removeTitle}>Remove this group</p>
            <div className={proto.removeText}>
              <RemoveGroupText group={group} groups={edits.groups} />
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
              {can === 'delete' ? 'Delete' : 'Hide'}
            </Button>
          )}
        </div>
      )}
    </ResponsiveDialog>
  );
}

/** A group's categories as tags you tap, the hidden ones dashed and quiet, and a dashed + Add at the end. */
function TagButtons({
  group,
  animate,
  big,
  onEdit,
  onAdd,
}: {
  group: ProtoGroup;
  animate: boolean;
  big: boolean;
  onEdit: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <ul
      className={cx(
        classes.tags,
        animate && classes.tagsIn,
        proto.tagButtons,
        big && proto.bigTags,
      )}
    >
      {shownOf(group).map((category) => (
        <li key={category.id}>
          <UnstyledButton
            className={proto.tagButton}
            onClick={() => {
              onEdit(category.id);
            }}
          >
            {category.name}
          </UnstyledButton>
        </li>
      ))}
      <li>
        <UnstyledButton
          className={cx(proto.tagButton, proto.addTag)}
          onClick={onAdd}
          aria-label={`Add a category to ${group.name}`}
        >
          <IconPlus size={16} stroke={1.7} aria-hidden />
          Add
        </UnstyledButton>
      </li>
      {hiddenOf(group).map((category) => (
        <li key={category.id}>
          <UnstyledButton
            className={cx(proto.tagButton, proto.hiddenTag)}
            aria-label={`${category.name}, hidden`}
            onClick={() => {
              onEdit(category.id);
            }}
          >
            <IconEyeOff size={16} stroke={1.7} aria-hidden />
            {category.name}
          </UnstyledButton>
        </li>
      ))}
    </ul>
  );
}

/**
 * The final prototype (variant 2, "Tap a tag", picked 2026-11-11): no edit mode. Every tag is a button that opens its
 * own sheet (name, group, place in the group, Hide or Delete); a dashed + Add ends each group's tags, hidden ones are
 * dashed and quiet after it; a group's pencil opens the group's sheet.
 */
export function ManageCategoriesPage() {
  const edits = useCategoryEdits();
  const wide = useMediaQuery(WIDE_QUERY, false, { getInitialValueInEffect: false });
  const [category, setCategory] = useState<CategoryTarget>();
  const [group, setGroup] = useState<GroupTarget>();
  // A new key each time, so a sheet opens with its own fresh state
  const [sheetKey, setSheetKey] = useState(0);
  const openCategory = (target: CategoryTarget) => {
    setSheetKey(sheetKey + 1);
    setCategory(target);
  };
  const openGroup = (target: GroupTarget) => {
    setSheetKey(sheetKey + 1);
    setGroup(target);
  };

  return (
    <>
      <header className={classes.head}>
        <Title order={1}>Categories</Title>
      </header>
      <ReadView
        groups={edits.groups}
        wide={wide}
        tags={(g, animate) => (
          <TagButtons
            group={g}
            animate={animate}
            big={wide}
            onEdit={(id) => {
              openCategory({ categoryId: id });
            }}
            onAdd={() => {
              openCategory({ newIn: g.id });
            }}
          />
        )}
        rowAction={(g) => (
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={`Edit the group ${g.name}`}
            onClick={() => {
              openGroup({ groupId: g.id });
            }}
          >
            <IconPencil size={20} stroke={1.7} />
          </ActionIcon>
        )}
        detailAction={(g) => (
          <Button
            variant="quiet"
            leftSection={<IconPencil size={20} stroke={1.7} />}
            onClick={() => {
              openGroup({ groupId: g.id });
            }}
          >
            Edit group
          </Button>
        )}
        kindFooter={(kind) => (
          <>
            {edits.groups.some((g) => g.kind === kind && g.hidden) && (
              <ul className={proto.rows}>
                {edits.groups
                  .filter((g) => g.kind === kind && g.hidden)
                  .map((g) => (
                    <HiddenRow
                      key={g.id}
                      name={g.name}
                      label="Hidden group"
                      onShow={() => {
                        edits.restoreGroup(g.id);
                      }}
                    />
                  ))}
              </ul>
            )}
            <UnstyledButton
              className={cx(proto.addRow, proto.addGroup)}
              onClick={() => {
                openGroup({ newKind: kind });
              }}
            >
              <IconPlus size={20} stroke={1.7} aria-hidden />
              {kind === 'Income' ? 'Add income group' : 'Add expense group'}
            </UnstyledButton>
          </>
        )}
      />
      {category && (
        <CategorySheet
          key={sheetKey}
          target={category}
          edits={edits}
          onClose={() => {
            setCategory(undefined);
          }}
        />
      )}
      {group && (
        <GroupSheet
          key={sheetKey}
          target={group}
          edits={edits}
          onClose={() => {
            setGroup(undefined);
          }}
        />
      )}
    </>
  );
}
