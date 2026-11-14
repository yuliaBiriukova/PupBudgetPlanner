import { useState, type ComponentType, type ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppLayout } from '../../app/shell/AppLayout';
import { OVERVIEW } from '../../features/accounts/accountsTestData';
import { AuthLayout } from '../../features/auth/AuthLayout';
import { SignInForm } from '../../features/auth/SignInForm';
import { SignUpForm } from '../../features/auth/SignUpForm';
import { SettingsPage } from '../../features/settings/SettingsPage';
import settings from '../../features/settings/Settings.module.css';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import type { Block } from './policy';

/** Where a prototype opens; the rest is reached inside it, through the links. */
export type Start = 'sign-in' | 'sign-up' | 'settings' | 'privacy';

export interface VariantParts {
  /** The /privacy page. */
  Page: ComponentType;
  /** What the sign-in and create-account pages get under their form. */
  AuthLink: ComponentType;
  /** The section Settings gets at its end. */
  SettingsSection: ComponentType;
}

const API: MockRoutes = {
  '/api/health': { json: { status: 'Healthy' } },
  '/api/settings': {
    json: { displayName: 'Yulia Biriukova', reportCurrency: 'UAH', email: 'yulia@example.com' },
  },
  '/api/accounts': { json: OVERVIEW },
  '/api/accounts/total': {
    json: { currency: 'UAH', total: 84250, ratesDate: '2026-11-14', status: 'Current', rates: [] },
  },
};

/**
 * The pages the change touches, with the variant's parts added: sign in and create account (the app's own frame and
 * forms, submitting does nothing), Settings (the app's page, a fake API) and /privacy.
 */
export function PrototypeScreens({ parts, start }: { parts: VariantParts; start: Start }) {
  const { Page, AuthLink, SettingsSection } = parts;
  const [router] = useState(() =>
    createMemoryRouter(
      [
        {
          path: '/sign-in',
          element: (
            <AuthLayout>
              <SignInForm onSubmit={() => undefined} pending={false} failure={null} />
              <AuthLink />
            </AuthLayout>
          ),
        },
        {
          path: '/sign-up',
          element: (
            <AuthLayout>
              <SignUpForm onSubmit={() => undefined} pending={false} failure={null} />
              <AuthLink />
            </AuthLayout>
          ),
        },
        {
          // Settings in the app's shell, signed in (on the phone it is in More)
          element: <AppLayout user={{ name: 'Yulia', email: 'yulia@example.com' }} />,
          children: [
            {
              path: '/settings',
              element: (
                <>
                  <SettingsPage />
                  <div className={settings.page}>
                    <SettingsSection />
                  </div>
                </>
              ),
            },
          ],
        },
        { path: '/privacy', element: <Page /> },
      ],
      { initialEntries: [`/${start}`] },
    ),
  );

  return (
    <MockFetch routes={API}>
      <RouterProvider router={router} />
    </MockFetch>
  );
}

/** The policy's blocks, styled by the variant's classes. */
export function Blocks({
  blocks,
  classes,
}: {
  blocks: Block[];
  classes: Readonly<Record<string, string>>;
}) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.kind === 'h3')
          return (
            <h3 key={i} className={classes.h3}>
              {block.text}
            </h3>
          );
        if (block.kind === 'p')
          return (
            <p key={i} className={classes.p}>
              {block.text}
            </p>
          );
        return (
          <ul key={i} className={classes.list}>
            {block.items.map((item, j) => (
              <li key={j}>
                {item.lead && <strong className={classes.lead}>{item.lead}</strong>}
                {item.lead && item.text ? ' ' : null}
                {item.text}
              </li>
            ))}
          </ul>
        );
      })}
    </>
  );
}

export function Section({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <section className={settings.section} aria-label={title}>
      <div>
        <h2 className={settings.title}>{title}</h2>
        <p className={settings.text}>{text}</p>
      </div>
      <div className={settings.control}>{children}</div>
    </section>
  );
}
