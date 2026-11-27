import { Button, Title, UnstyledButton } from '@mantine/core';
import { IconAlertTriangle, IconCheck, IconPlus } from '@tabler/icons-react';
import { useId, type CSSProperties } from 'react';
import { OVERVIEW } from '../../features/accounts/accountsTestData';
import { formatMoney } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import { goalText, JAR_ICONS, jarStyle, splitTotal } from './jarHelpers';
import { inJarsOf, progress, reached, savedIn, type Jar } from './jars';
import classes from './Jars.module.css';
import { useJarDialogs } from './useJarDialogs';
import { useJarWorld } from './worldContext';

/**
 * The final prototype's Jars page: Jars after Budget in the menu; on top what is set aside and what is free; the jars
 * drawn on a shelf, each with Put in under it (owner, 2026-11-19: no table view); under them, the accounts the jar
 * money lies on.
 */
export function JarsPage() {
  const world = useJarWorld();
  const jars = useJarDialogs();
  const accountsHeading = useId();
  const open = world.jars.filter((jar) => !jar.closed);
  const { inJars, free } = splitTotal(world.moves);
  const holding = OVERVIEW.accounts.filter((a) => inJarsOf(a, world.moves) !== 0);

  return (
    <div className={classes.page}>
      <header className={classes.pageHead}>
        <Title order={1}>Jars</Title>
        <Button leftSection={<IconPlus size={20} stroke={1.7} />} onClick={jars.addJar}>
          New jar
        </Button>
      </header>

      <div className={classes.summary} role="group" aria-label="Set aside and free">
        <div>
          <span className={classes.summarySmall}>Set aside, in UAH</span>
          <span className={cx(classes.summaryAmount, classes.num)}>
            {formatMoney(inJars, 'UAH')}
          </span>
        </div>
        <div>
          <span className={classes.summarySmall}>Free to spend</span>
          <span className={cx(classes.summaryAmount, classes.num)}>{formatMoney(free, 'UAH')}</span>
        </div>
      </div>

      <div className={classes.shelf}>
        <ul className={classes.shelfList}>
          {open.map((jar) => (
            <li key={jar.id} className={classes.shelfItem}>
              <JarTile jar={jar} onOpen={jars.openJar} />
              <Button
                variant="quiet"
                leftSection={<IconPlus size={16} stroke={1.7} />}
                aria-label={`Put in ${jar.name}`}
                onClick={() => {
                  jars.moveJar(jar, 'in');
                }}
              >
                Put in
              </Button>
            </li>
          ))}
          <li className={classes.shelfItem}>
            <UnstyledButton className={cx(classes.tile, classes.tileNew)} onClick={jars.addJar}>
              <IconPlus size={24} stroke={1.7} aria-hidden />
              <span>New jar</span>
            </UnstyledButton>
          </li>
        </ul>
      </div>

      <section className={classes.freeList} aria-labelledby={accountsHeading}>
        <h2 id={accountsHeading} className={classes.subhead}>
          Where the jar money lies
        </h2>
        <ul className={classes.rows}>
          {holding.map((account) => {
            const inside = inJarsOf(account, world.moves);
            const left = account.balance - inside;
            return (
              <li key={account.id} className={classes.row}>
                <span className={classes.rowMain}>
                  {account.name}
                  <span className={cx(classes.rowDate, left < 0 && classes.over)}>
                    {left < 0 ? (
                      <span className={classes.rowWarn}>
                        <IconAlertTriangle size={16} stroke={1.7} aria-hidden />
                        Jars short by {formatMoney(-left, account.currency)}
                      </span>
                    ) : (
                      `${formatMoney(left, account.currency)} free of ${formatMoney(account.balance, account.currency)}`
                    )}
                  </span>
                </span>
                <span className={classes.num}>{formatMoney(inside, account.currency)} in jars</span>
              </li>
            );
          })}
        </ul>
      </section>
      {jars.dialogs}
    </div>
  );
}

/** One jar on the shelf: the glass filled to the progress (a quarter without a goal), its name and amounts. */
function JarTile({ jar, onOpen }: { jar: Jar; onOpen: (jar: Jar) => void }) {
  const world = useJarWorld();
  const saved = savedIn(jar, world.moves);
  const Glyph = JAR_ICONS[jar.icon];
  const fill = jar.goal === null ? 0.25 : progress(jar, saved);
  return (
    <UnstyledButton
      className={classes.tile}
      onClick={() => {
        onOpen(jar);
      }}
    >
      <span
        className={classes.glass}
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
        {formatMoney(saved, jar.currency)}
      </span>
      <span className={cx(classes.tileGoal, reached(jar, saved) && classes.reached)}>
        {reached(jar, saved) && <IconCheck size={16} stroke={1.7} aria-hidden />}
        {goalText(jar, saved)}
      </span>
    </UnstyledButton>
  );
}
