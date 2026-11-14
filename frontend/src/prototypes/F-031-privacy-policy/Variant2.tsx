import { Collapse, UnstyledButton } from '@mantine/core';
import { IconArrowLeft, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router';
import { BrandName, Logo } from '../../app/shell/Logo';
import { Blocks, Section } from './Frame';
import { useBack } from './useBack';
import { INTRO, IN_SHORT, SECTIONS, UPDATED } from './policy';
import classes from './Variant2.module.css';

/** The section in view, for the contents' marker. */
function useSectionInView() {
  const [inView, setInView] = useState(SECTIONS[0]?.id ?? '');
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).map((e) => e.target.id)[0];
        if (top) setInView(top.replace('v2-', ''));
      },
      { rootMargin: '0px 0px -70% 0px' },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(`v2-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => {
      observer.disconnect();
    };
  }, []);
  return inView;
}

function Contents({ inView, onPick }: { inView?: string; onPick?: () => void }) {
  return (
    <ol className={classes.contents}>
      {SECTIONS.map((s) => (
        <li key={s.id}>
          <a
            href={`#v2-${s.id}`}
            className={classes.contentsLink}
            aria-current={inView === s.id ? 'location' : undefined}
            onClick={(event) => {
              event.preventDefault();
              document.getElementById(`v2-${s.id}`)?.scrollIntoView({ behavior: 'smooth' });
              onPick?.();
            }}
          >
            {s.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * Variant 2 "A document with contents": a reading page under the app's own top line. On the desktop the contents stay
 * beside the text and mark the section being read; on the phone they fold under the title.
 */
export function Page() {
  const back = useBack();
  const inView = useSectionInView();
  const [open, setOpen] = useState(false);
  const foldId = useId();

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
      <div className={classes.body}>
        <nav className={classes.side} aria-label="On this page">
          <p className={classes.sideTitle}>On this page</p>
          <Contents inView={inView} />
        </nav>
        <main className={classes.text}>
          <h1 className={classes.title}>Privacy policy</h1>
          <p className={classes.updated}>Last updated {UPDATED}</p>
          <p className={classes.inShort}>{IN_SHORT}</p>
          <p className={classes.p}>{INTRO}</p>

          <nav className={classes.fold} aria-label="On this page">
            <UnstyledButton
              className={classes.foldHead}
              aria-expanded={open}
              aria-controls={foldId}
              onClick={() => {
                setOpen((now) => !now);
              }}
            >
              <span>On this page</span>
              <IconChevronDown size={20} stroke={1.7} aria-hidden className={classes.chevron} />
            </UnstyledButton>
            <Collapse expanded={open} transitionDuration={160}>
              <div id={foldId} className={classes.foldBody}>
                <Contents
                  onPick={() => {
                    setOpen(false);
                  }}
                />
              </div>
            </Collapse>
          </nav>

          {SECTIONS.map((section) => (
            <section key={section.id} id={`v2-${section.id}`} className={classes.section}>
              <h2 className={classes.h2}>{section.title}</h2>
              <Blocks blocks={section.blocks} classes={classes} />
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}

export function AuthLink() {
  return (
    <p className={classes.authFoot}>
      <Link to="/privacy" className={classes.authLink}>
        Privacy policy
      </Link>
    </p>
  );
}

export function SettingsSection() {
  return (
    <Section title="Privacy" text="What Pup Budget keeps about you and who can see it.">
      <Link to="/privacy" className={classes.row}>
        <span className={classes.rowText}>
          <span className={classes.rowTitle}>Privacy policy</span>
          <span className={classes.rowHint}>Last updated {UPDATED}</span>
        </span>
        <IconChevronRight size={20} stroke={1.7} aria-hidden className={classes.rowIcon} />
      </Link>
    </Section>
  );
}
