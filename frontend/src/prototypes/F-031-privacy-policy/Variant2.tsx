import { Collapse, UnstyledButton } from '@mantine/core';
import { IconArrowLeft, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { BrandName, Logo } from '../../app/shell/Logo';
import { Blocks, Section } from './Frame';
import { useBack } from './useBack';
import { INTRO, IN_SHORT, SECTIONS, UPDATED } from './policy';
import classes from './Variant2.module.css';

/** How far down the window a section's heading has to come to count as the one being read. */
const READ_LINE = 120;

/**
 * The section being read, for the contents' marker: the last one whose heading has passed the reading line. A
 * section picked in the contents is marked even when the page can't scroll it that far up (the last ones), until the
 * person scrolls by hand.
 */
function useSectionInView() {
  const [inView, setInView] = useState(SECTIONS[0]?.id ?? '');
  const picked = useRef<string | null>(null);

  useEffect(() => {
    const update = () => {
      const atEnd =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (picked.current && atEnd) {
        setInView(picked.current);
        return;
      }
      let current = SECTIONS[0]?.id ?? '';
      for (const s of SECTIONS) {
        const top = document.getElementById(`v2-${s.id}`)?.getBoundingClientRect().top;
        if (top !== undefined && top <= READ_LINE) current = s.id;
      }
      setInView(current);
    };
    const byHand = () => {
      picked.current = null;
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('wheel', byHand, { passive: true });
    window.addEventListener('touchmove', byHand, { passive: true });
    window.addEventListener('keydown', byHand);
    update();
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('wheel', byHand);
      window.removeEventListener('touchmove', byHand);
      window.removeEventListener('keydown', byHand);
    };
  }, []);

  const pick = (id: string) => {
    picked.current = id;
    setInView(id);
  };
  return { inView, pick };
}

/** Scrolls to a section; after a fold closes (the phone's contents), once it has closed, so the page doesn't jump. */
function goTo(id: string, afterFold: boolean) {
  const scroll = () => {
    document.getElementById(`v2-${id}`)?.scrollIntoView({ behavior: 'smooth' });
  };
  if (afterFold) window.setTimeout(scroll, FOLD_MS + 40);
  else scroll();
}

const FOLD_MS = 160;

function Contents({
  inView,
  onPick,
  inFold = false,
}: {
  inView?: string;
  onPick: (id: string) => void;
  inFold?: boolean;
}) {
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
              onPick(s.id);
              goTo(s.id, inFold);
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
  const { inView, pick } = useSectionInView();
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
          <Contents inView={inView} onPick={pick} />
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
            <Collapse expanded={open} transitionDuration={FOLD_MS}>
              <div id={foldId} className={classes.foldBody}>
                <Contents
                  inFold
                  onPick={(id) => {
                    pick(id);
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
