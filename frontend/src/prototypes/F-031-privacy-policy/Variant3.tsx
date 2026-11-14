import { Button, Collapse, UnstyledButton } from '@mantine/core';
import { IconArrowLeft, IconCheck, IconChevronDown } from '@tabler/icons-react';
import { useId, useState } from 'react';
import { Link } from 'react-router';
import { BrandName, Logo } from '../../app/shell/Logo';
import { Blocks, Section } from './Frame';
import { useBack } from './useBack';
import { CONTACT, PROMISES, SECTIONS, UPDATED, type PolicySection } from './policy';
import classes from './Variant3.module.css';

function Answer({
  section,
  open,
  onToggle,
}: {
  section: PolicySection;
  open: boolean;
  onToggle: () => void;
}) {
  const bodyId = useId();
  return (
    <div className={classes.fold}>
      <UnstyledButton
        className={classes.foldHead}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
      >
        <span className={classes.foldText}>
          <span className={classes.question}>{section.question}</span>
          <span className={classes.answer}>{section.answer}</span>
        </span>
        <IconChevronDown size={20} stroke={1.7} aria-hidden className={classes.chevron} />
      </UnstyledButton>
      <Collapse expanded={open} transitionDuration={160}>
        <div id={bodyId} className={classes.foldBody}>
          <Blocks blocks={section.blocks} classes={classes} />
        </div>
      </Collapse>
    </div>
  );
}

/**
 * Variant 3 "Answers first": one sentence that says it all in the display face, then the questions people ask, each
 * with its answer in a line; a tap opens the full text. "Open all" shows the whole policy at once.
 */
export function Page() {
  const back = useBack();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const allOpen = open.size === SECTIONS.length;

  return (
    <div className={classes.root}>
      <header className={classes.top}>
        <Link to="/sign-in" className={classes.brand}>
          <Logo />
          <BrandName />
        </Link>
        <UnstyledButton className={classes.back} onClick={back}>
          <IconArrowLeft size={20} stroke={1.7} aria-hidden />
          <span>Back</span>
        </UnstyledButton>
      </header>
      <main className={classes.body}>
        <h1 className={classes.title}>Privacy policy</h1>
        <p className={classes.updated}>Last updated {UPDATED}</p>
        <p className={classes.statement}>
          Only you, and the family you choose, see your money. No ads, no trackers, never sold.
        </p>
        <p className={classes.p}>
          Pup Budget is a small app run by one person for a family and the people they invite. Here
          is what it keeps and why.
        </p>

        <div className={classes.listHead}>
          <h2 className={classes.listTitle}>Your questions</h2>
          <UnstyledButton
            className={classes.openAll}
            onClick={() => {
              setOpen(allOpen ? new Set() : new Set(SECTIONS.map((s) => s.id)));
            }}
          >
            {allOpen ? 'Close all' : 'Open all'}
          </UnstyledButton>
        </div>
        <div className={classes.folds}>
          {SECTIONS.map((section) => (
            <Answer
              key={section.id}
              section={section}
              open={open.has(section.id)}
              onToggle={() => {
                setOpen((now) => {
                  const next = new Set(now);
                  if (next.has(section.id)) next.delete(section.id);
                  else next.add(section.id);
                  return next;
                });
              }}
            />
          ))}
        </div>
        <p className={classes.contact}>
          Anything else about your data: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
        </p>
      </main>
    </div>
  );
}

export function AuthLink() {
  return (
    <Link to="/privacy" className={classes.authLink}>
      <span className={classes.authTitle}>Your money stays yours</span>
      <span className={classes.authText}>What Pup Budget keeps and who can see it</span>
    </Link>
  );
}

export function SettingsSection() {
  return (
    <Section title="Your data" text="What Pup Budget keeps about you and who can see it.">
      <ul className={classes.promises}>
        {PROMISES.map((promise) => (
          <li key={promise}>
            <IconCheck size={16} stroke={2} aria-hidden className={classes.check} />
            {promise}
          </li>
        ))}
      </ul>
      <div>
        <Button component={Link} to="/privacy" variant="default">
          Read the privacy policy
        </Button>
      </div>
    </Section>
  );
}
