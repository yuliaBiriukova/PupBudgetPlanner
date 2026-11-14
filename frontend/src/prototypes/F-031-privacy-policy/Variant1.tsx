import { Button, UnstyledButton } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Link } from 'react-router';
import { Logo } from '../../app/shell/Logo';
import { Blocks, Section } from './Frame';
import { useBack } from './useBack';
import { INTRO, IN_SHORT, PROMISES, SECTIONS, UPDATED } from './policy';
import classes from './Variant1.module.css';

/**
 * Variant 1 "In the sign-in frame": the page wears the sign-in screens' frame. The charcoal half holds the promises
 * and stays put on the desktop; the policy reads on the light half beside it. On the phone the band is on top and the
 * text card overlaps it.
 */
export function Page() {
  const back = useBack();
  return (
    <div className={classes.root}>
      <header className={classes.hero}>
        <div className={classes.heroBody}>
          <Logo className={classes.logo} iconSize={24} />
          <h1 className={classes.title}>Your data in Pup Budget</h1>
          <ul className={classes.promises}>
            {PROMISES.map((promise) => (
              <li key={promise}>{promise}</li>
            ))}
          </ul>
          <p className={classes.inShort}>{IN_SHORT}</p>
        </div>
      </header>
      <main className={classes.textSide}>
        <article className={classes.text}>
          <UnstyledButton className={classes.back} onClick={back}>
            <IconArrowLeft size={20} stroke={1.7} aria-hidden />
            <span>Back</span>
          </UnstyledButton>
          <p className={classes.updated}>Privacy policy, last updated {UPDATED}</p>
          <p className={classes.p}>{INTRO}</p>
          {SECTIONS.map((section) => (
            <section key={section.id} aria-labelledby={`v1-${section.id}`}>
              <h2 id={`v1-${section.id}`} className={classes.h2}>
                {section.title}
              </h2>
              <Blocks blocks={section.blocks} classes={classes} />
            </section>
          ))}
        </article>
      </main>
    </div>
  );
}

export function AuthLink() {
  return (
    <Link to="/privacy" className={classes.authLink}>
      How Pup Budget keeps your data
    </Link>
  );
}

export function SettingsSection() {
  return (
    <Section title="Your data" text="What Pup Budget keeps about you and who can see it.">
      <div>
        <Button component={Link} to="/privacy" variant="default">
          Read the privacy policy
        </Button>
      </div>
    </Section>
  );
}
