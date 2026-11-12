import { ActionIcon, Avatar, Tooltip, UnstyledButton } from '@mantine/core';
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLogout,
  IconPlus,
} from '@tabler/icons-react';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { WhoseLens } from '../../features/family/WhoseLens';
import { ColorSchemeToggle } from '../../shared/ui/ColorSchemeToggle';
import { cx } from '../../shared/ui/cx';
import { FadingScrollArea } from '../../shared/ui/FadingScrollArea';
import { BrandName, Logo } from './Logo';
import { ADMIN_SECTIONS, SECTIONS, type ShellUser } from './sections';
import classes from './Sidebar.module.css';
import { SIDEBAR, type SidebarState } from './useSidebar';

interface SidebarProps {
  state: SidebarState;
  user?: ShellUser;
  onAdd: () => void;
  onSignOut?: () => void;
}

/** The width the head row needs to show the whole app name: padding, logo, name and the collapse button. */
function measureHead(head: HTMLElement): number {
  const px = (value: string) => parseFloat(value) || 0;
  const sidebar = getComputedStyle(head.parentElement ?? head);
  const row = getComputedStyle(head);
  const items = Array.from(head.children).filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && getComputedStyle(el).position !== 'absolute',
  );
  const content = items.reduce((sum, el) => sum + Math.max(el.offsetWidth, el.scrollWidth), 0);
  return (
    content +
    px(row.columnGap) * (items.length - 1) +
    px(row.paddingLeft) +
    px(row.paddingRight) +
    px(sidebar.paddingLeft) +
    px(sidebar.paddingRight) +
    px(sidebar.borderRightWidth) +
    4
  );
}

/** Shows a tooltip to the right only in the rail, where labels are hidden. */
function RailTip({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: ReactElement;
}) {
  return (
    <Tooltip label={label} position="right" offset={10} disabled={!collapsed}>
      {children}
    </Tooltip>
  );
}

/**
 * The desktop sidebar. Collapses to a 72 px icon rail with the button next to the logo; in the rail the logo
 * itself is the expand button. Its right edge can be dragged (or moved with ← → and Enter) to resize it.
 */
export function Sidebar({ state, user, onAdd, onSignOut }: SidebarProps) {
  const { t } = useTranslation();
  const headRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLButtonElement>(null);
  const collapseRef = useRef<HTMLButtonElement>(null);
  const focusAfterToggle = useRef(false);
  const { collapsed, setMinWidth } = state;

  // The minimum width fits the whole app name in the loaded display font
  useLayoutEffect(() => {
    const measure = () => {
      if (headRef.current) setMinWidth(measureHead(headRef.current));
    };
    measure();
    // jsdom has no font loading API
    if ('fonts' in document) void document.fonts.ready.then(measure);
  }, [setMinWidth]);

  // The clicked button disappears; focus moves to the one that replaces it
  useEffect(() => {
    if (!focusAfterToggle.current) return;
    focusAfterToggle.current = false;
    (collapsed ? logoRef : collapseRef).current?.focus();
  }, [collapsed]);

  const toggle = () => {
    focusAfterToggle.current = true;
    state.toggle();
  };

  const startResize = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const handle = event.currentTarget;
    const left = (handle.parentElement ?? handle).getBoundingClientRect().left;
    handle.setPointerCapture(event.pointerId);
    state.setResizing(true);
    const move = (e: globalThis.PointerEvent) => {
      state.dragTo(e.clientX - left);
    };
    const end = () => {
      state.setResizing(false);
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  };

  const resizeWithKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      state.step(event.key === 'ArrowLeft' ? 'narrower' : 'wider');
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      state.toggle();
    }
  };

  return (
    <aside
      className={classes.sidebar}
      data-collapsed={collapsed || undefined}
      aria-label={t('shell.sidebar')}
    >
      <div className={classes.head} ref={headRef}>
        <RailTip label={t('shell.expandSidebar')} collapsed={collapsed}>
          <UnstyledButton
            ref={logoRef}
            className={classes.logoButton}
            inert={!collapsed}
            aria-label={t('shell.expandSidebar')}
            onClick={toggle}
          >
            <Logo />
            <IconLayoutSidebarLeftExpand className={classes.expandIcon} size={20} stroke={1.7} />
          </UnstyledButton>
        </RailTip>
        <BrandName className={cx(classes.label, classes.name)} />
        <ActionIcon
          ref={collapseRef}
          className={cx(classes.collapseButton, classes.fade)}
          variant="subtle"
          color="gray"
          aria-label={t('shell.collapseSidebar')}
          onClick={toggle}
        >
          <IconLayoutSidebarLeftCollapse size={20} stroke={1.7} />
        </ActionIcon>
      </div>

      <RailTip label={t('shell.addTransaction')} collapsed={collapsed}>
        <UnstyledButton className={classes.add} onClick={onAdd}>
          <IconPlus size={20} stroke={1.7} />
          <span className={classes.label}>{t('shell.addTransaction')}</span>
        </UnstyledButton>
      </RailTip>

      {/* Whose money the pages show (F-024): only in a family with someone else in it */}
      <WhoseLens place="sidebar" collapsed={collapsed} />

      {/* In a low window the sections scroll between the Add button and the account row (I-004) */}
      <FadingScrollArea className={classes.navScroll}>
        <nav className={classes.nav} aria-label={t('nav.main')}>
          {SECTIONS.map(({ id, path, icon: Icon }) => (
            <RailTip key={id} label={t(`nav.${id}`)} collapsed={collapsed}>
              <UnstyledButton component={NavLink} to={path} className={classes.link}>
                <Icon size={20} stroke={1.7} />
                <span className={classes.label}>{t(`nav.${id}`)}</span>
              </UnstyledButton>
            </RailTip>
          ))}
          {user?.isAdmin && (
            <>
              <div className={classes.navRule} role="presentation" />
              {ADMIN_SECTIONS.map(({ id, path, icon: Icon }) => (
                <RailTip key={id} label={t(`nav.${id}`)} collapsed={collapsed}>
                  <UnstyledButton component={NavLink} to={path} className={classes.link}>
                    <Icon size={20} stroke={1.7} />
                    <span className={classes.label}>{t(`nav.${id}`)}</span>
                  </UnstyledButton>
                </RailTip>
              ))}
            </>
          )}
        </nav>
      </FadingScrollArea>

      <div className={classes.foot}>
        {user && (
          <>
            <Avatar size={32} radius="xl" color="gray" aria-hidden="true">
              {user.name.slice(0, 1)}
            </Avatar>
            <span className={cx(classes.label, classes.footName)}>{user.name}</span>
          </>
        )}
        <div className={cx(classes.footTools, classes.fade)}>
          <ColorSchemeToggle />
          {user && (
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label={t('shell.signOut')}
              onClick={onSignOut}
            >
              <IconLogout size={20} stroke={1.7} />
            </ActionIcon>
          )}
        </div>
      </div>

      <div
        className={classes.resize}
        data-active={state.resizing || undefined}
        role="separator"
        aria-orientation="vertical"
        aria-label={t('shell.resizeSidebar')}
        aria-valuemin={state.minWidth}
        aria-valuemax={SIDEBAR.max}
        aria-valuenow={collapsed ? SIDEBAR.rail : state.width}
        aria-valuetext={
          collapsed ? t('shell.collapsed') : t('shell.widthPixels', { width: state.width })
        }
        title={t('shell.resizeHint')}
        tabIndex={0}
        onPointerDown={startResize}
        onDoubleClick={state.toggle}
        onKeyDown={resizeWithKeys}
      />
    </aside>
  );
}
