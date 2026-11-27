import { Button, Skeleton, Title, UnstyledButton } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconPlus, IconRefresh } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import { accountsQuery, accountsTotalQueryOf } from '../accounts/accountsApi';
import tx from '../transactions/TransactionsPage.module.css';
import { JarMoney } from './JarMoney';
import { useGoalText } from './jarTexts';
import { JAR_ICONS, jarStyle, progress, reached } from './jars';
import { jarsQuery, type Jar } from './jarsApi';
import classes from './Jars.module.css';
import { useJarDialogs } from './useJarDialogs';

/**
 * The Jars page (F-034, final prototype): Jars after Budget in the menu; on top what is set aside and what is free to
 * spend, in the report currency; the jars drawn on a shelf, each with Put in under it, and a dashed New jar; under them,
 * where the jar money lies. Personal: whose money the rest of the app shows doesn't change it.
 */
export function JarsPage() {
  const { t } = useTranslation();
  const jars = useQuery(jarsQuery);
  const accounts = useQuery(accountsQuery);
  const total = useQuery(accountsTotalQueryOf());
  const dialogs = useJarDialogs();
  const currency = total.data?.currency ?? 'UAH';
  const inJars = total.data?.inJars ?? null;
  const free = total.data?.total != null && inJars != null ? total.data.total - inJars : null;

  return (
    <div className={classes.page}>
      <header className={classes.pageHead}>
        <Title order={1}>{t('jars.title')}</Title>
        <Button leftSection={<IconPlus size={20} stroke={1.7} />} onClick={dialogs.addJar}>
          {t('jars.newJar')}
        </Button>
      </header>

      <div className={classes.summary} role="group" aria-label={t('jars.summary.label')}>
        <div>
          <span className={classes.summarySmall}>{t('jars.summary.setAside', { currency })}</span>
          {inJars == null ? (
            <Skeleton height={32} width={160} radius="sm" mt={4} />
          ) : (
            <span className={cx(classes.summaryAmount, classes.num)} data-testid="jars-set-aside">
              {formatMoney(inJars, currency)}
            </span>
          )}
        </div>
        <div>
          <span className={classes.summarySmall}>{t('jars.summary.free')}</span>
          {free == null ? (
            <Skeleton height={32} width={160} radius="sm" mt={4} />
          ) : (
            <span className={cx(classes.summaryAmount, classes.num)} data-testid="jars-free">
              {formatMoney(free, currency)}
            </span>
          )}
        </div>
      </div>

      {jars.isPending ? (
        <div
          className={classes.shelf}
          role="status"
          aria-busy="true"
          aria-label={t('jars.loading')}
        >
          <ul className={classes.shelfList}>
            {[0, 1, 2].map((i) => (
              <li key={i} className={classes.shelfItem}>
                <Skeleton height={200} radius="md" />
              </li>
            ))}
          </ul>
        </div>
      ) : jars.isError ? (
        <div className={tx.errorBanner} role="alert">
          <IconAlertCircle size={20} stroke={1.7} aria-hidden />
          <div>
            <p>{t('jars.error')}</p>
            <UnstyledButton
              className={tx.textLink}
              onClick={() => {
                void jars.refetch();
              }}
            >
              <IconRefresh size={20} stroke={1.7} aria-hidden />
              {t('jars.retry')}
            </UnstyledButton>
          </div>
        </div>
      ) : (
        <>
          <div className={classes.shelf}>
            <ul className={classes.shelfList}>
              {jars.data.map((jar) => (
                <li key={jar.id} className={classes.shelfItem}>
                  <JarTile jar={jar} fresh={dialogs.fresh === jar.id} onOpen={dialogs.openJar} />
                  <Button
                    variant="quiet"
                    leftSection={<IconPlus size={16} stroke={1.7} />}
                    aria-label={t('jars.putInto', { name: jar.name })}
                    onClick={() => {
                      dialogs.moveJar(jar, 'in');
                    }}
                  >
                    {t('jars.window.putIn')}
                  </Button>
                </li>
              ))}
              <li className={classes.shelfItem}>
                <UnstyledButton
                  className={cx(classes.tile, classes.tileNew)}
                  onClick={dialogs.addJar}
                >
                  <IconPlus size={24} stroke={1.7} aria-hidden />
                  <span>{t('jars.newJar')}</span>
                </UnstyledButton>
              </li>
            </ul>
            {jars.data.length === 0 && <p className={classes.emptyText}>{t('jars.empty')}</p>}
          </div>
          <JarMoney jars={jars.data} accounts={accounts.data?.accounts ?? []} />
        </>
      )}
      {dialogs.dialogs}
    </div>
  );
}

/** One jar on the shelf: the glass filled to the progress (a quarter without a goal), its name and amounts. */
function JarTile({ jar, fresh, onOpen }: { jar: Jar; fresh: boolean; onOpen: (jar: Jar) => void }) {
  const goalText = useGoalText();
  const Glyph = JAR_ICONS[jar.icon];
  const fill = jar.goal === null ? 0.25 : progress(jar, jar.saved);
  const done = reached(jar, jar.saved);
  return (
    <UnstyledButton
      className={classes.tile}
      data-testid="jar-tile"
      onClick={() => {
        onOpen(jar);
      }}
    >
      <span
        className={classes.glass}
        data-fresh={fresh ? true : undefined}
        style={
          {
            ...jarStyle(jar.color),
            '--fill': `${String(Math.max(fill, 0.04) * 100)}%`,
          } as CSSProperties
        }
        aria-hidden
      >
        <span className={classes.lid} />
        <span className={classes.body}>
          <span className={classes.glassIcon}>
            <Glyph size={32} stroke={1.5} />
          </span>
        </span>
      </span>
      <span className={classes.tileName}>{jar.name}</span>
      <span className={cx(classes.tileAmount, classes.num)}>
        {formatMoney(jar.saved, jar.currency)}
      </span>
      <span className={cx(classes.tileGoal, done && classes.reached)}>
        {done && <IconCheck size={16} stroke={1.7} aria-hidden />}
        {goalText(jar)}
      </span>
    </UnstyledButton>
  );
}
