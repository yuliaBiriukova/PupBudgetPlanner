import { useQuery } from '@tanstack/react-query';
import { useId, type ReactNode } from 'react';
import settings from '../../features/settings/Settings.module.css';
import { SettingsPage } from '../../features/settings/SettingsPage';
import { settingsQuery } from '../../features/settings/settingsApi';
import { cx } from '../../shared/ui/cx';
import classes from './DeleteAccount.module.css';

/** The real Settings page, and the new section under it once the page has loaded. */
export function ProtoSettings({ section }: { section: ReactNode }) {
  const loaded = useQuery(settingsQuery).isSuccess;
  return (
    <>
      <SettingsPage />
      {loaded && <div className={settings.page}>{section}</div>}
    </>
  );
}

/** The last section of Settings, set apart by a wider gap above it, laid out like the others. */
export function DeleteSection({ text, children }: { text: string; children: ReactNode }) {
  const id = useId();
  return (
    <section className={cx(settings.section, classes.apart)} aria-labelledby={id}>
      <div>
        <h2 id={id} className={settings.title}>
          Delete account
        </h2>
        <p className={settings.text}>{text}</p>
      </div>
      <div className={settings.control}>{children}</div>
    </section>
  );
}
