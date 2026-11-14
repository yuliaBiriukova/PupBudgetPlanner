import { Collapse, UnstyledButton } from '@mantine/core';
import { IconArrowLeft, IconChevronDown } from '@tabler/icons-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';
import { BrandName, Logo } from '../../app/shell/Logo';
import {
  contactEmail,
  formatLongDate,
  POLICY_UPDATED,
  SECTION_IDS,
  sectionElementId,
  type PolicyBlock,
  type PolicySection,
  type SectionId,
} from './policy';
import classes from './PrivacyPolicy.module.css';

/** How far down the window a section's heading has to come to count as the one being read. */
const READ_LINE = 120;
/** The phone's contents fold: how long it takes to close. */
const FOLD_MS = 160;

/**
 * The privacy policy (F-031, final prototype: variant 2 "A document with contents"), open to anyone, signed in or not,
 * and with no request to the API: the text is part of the app. Under the app's top line; on the desktop the contents
 * stay beside the text and mark the section being read, on the phone they fold under the intro.
 */
export function PrivacyPolicyPage() {
  const { t } = useTranslation();
  const back = useBack();
  const { inView, pick } = useSectionInView();
  const [open, setOpen] = useState(false);
  const foldId = useId();
  const contact = contactEmail() || t('privacyPolicy.contactFallback');

  return (
    <div className={classes.root}>
      <header className={classes.top}>
        <Link to="/" className={classes.brand} aria-label={t('privacyPolicy.home')}>
          <Logo />
          <BrandName />
        </Link>
        <UnstyledButton className={classes.back} onClick={back}>
          <IconArrowLeft size={20} stroke={1.7} aria-hidden="true" />
          <span>{t('privacyPolicy.back')}</span>
        </UnstyledButton>
      </header>
      <div className={classes.body}>
        <nav className={classes.side} aria-label={t('privacyPolicy.onThisPage')}>
          <p className={classes.sideTitle} aria-hidden="true">
            {t('privacyPolicy.onThisPage')}
          </p>
          <Contents inView={inView} onPick={pick} />
        </nav>
        <main className={classes.text}>
          <h1 className={classes.title}>{t('privacyPolicy.title')}</h1>
          <p className={classes.updated}>
            {t('privacyPolicy.updated', { date: formatLongDate(POLICY_UPDATED) })}
          </p>
          <p className={classes.inShort}>{t('privacyPolicy.inShort')}</p>
          <p className={classes.p}>{t('privacyPolicy.intro')}</p>

          <nav className={classes.fold} aria-label={t('privacyPolicy.onThisPage')}>
            <UnstyledButton
              className={classes.foldHead}
              aria-expanded={open}
              aria-controls={foldId}
              onClick={() => {
                setOpen((now) => !now);
              }}
            >
              <span>{t('privacyPolicy.onThisPage')}</span>
              <IconChevronDown
                size={20}
                stroke={1.7}
                aria-hidden="true"
                className={classes.chevron}
              />
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

          {SECTION_IDS.map((id) => (
            <PolicySectionView key={id} id={id} contact={contact} />
          ))}
        </main>
      </div>
    </div>
  );
}

function PolicySectionView({ id, contact }: { id: SectionId; contact: string }) {
  const { t } = useTranslation();
  const section: PolicySection = t(`privacyPolicy.sections.${id}`, {
    returnObjects: true,
    contact,
  });
  const headingId = `${sectionElementId(id)}-title`;

  return (
    <section id={sectionElementId(id)} className={classes.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={classes.h2}>
        {section.title}
      </h2>
      {section.blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </section>
  );
}

function Block({ block }: { block: PolicyBlock }) {
  if (block.heading) return <h3 className={classes.h3}>{block.heading}</h3>;
  if (block.items) {
    return (
      <ul className={classes.list}>
        {block.items.map((item, i) => (
          <li key={i}>
            {item.lead && <strong className={classes.lead}>{item.lead}</strong>}
            {item.lead && item.text ? ' ' : null}
            {item.text}
          </li>
        ))}
      </ul>
    );
  }
  return <p className={classes.p}>{block.text}</p>;
}

function Contents({
  inView,
  onPick,
  inFold = false,
}: {
  inView?: SectionId;
  onPick: (id: SectionId) => void;
  inFold?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <ol className={classes.contents}>
      {SECTION_IDS.map((id) => (
        <li key={id}>
          <a
            href={`#${sectionElementId(id)}`}
            className={classes.contentsLink}
            aria-current={inView === id ? 'location' : undefined}
            onClick={(event) => {
              event.preventDefault();
              onPick(id);
              goTo(id, inFold);
            }}
          >
            {t(`privacyPolicy.sections.${id}.title`)}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Scrolls to a section; from the phone's fold only once it has closed, so the page doesn't jump under the scroll. */
function goTo(id: SectionId, afterFold: boolean) {
  const scroll = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById(sectionElementId(id))
      ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  if (afterFold) window.setTimeout(scroll, FOLD_MS + 40);
  else scroll();
}

/**
 * The section being read, for the contents' marker: the first at the top of the page, then the last one whose heading
 * has passed the reading line. A section
 * picked in the contents stays marked when the page can't scroll it that far up (the last ones), until the person
 * scrolls by hand.
 */
function useSectionInView() {
  const [inView, setInView] = useState<SectionId>(SECTION_IDS[0]);
  const picked = useRef<SectionId | null>(null);

  useEffect(() => {
    const update = () => {
      const atEnd =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (picked.current && atEnd) {
        setInView(picked.current);
        return;
      }
      let current: SectionId = SECTION_IDS[0];
      // At the very top the first section is the one being read
      if (window.scrollY <= 0) {
        setInView(current);
        return;
      }
      for (const id of SECTION_IDS) {
        const top = document.getElementById(sectionElementId(id))?.getBoundingClientRect().top;
        if (top !== undefined && top <= READ_LINE) current = id;
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

  const pick = (id: SectionId) => {
    picked.current = id;
    setInView(id);
  };
  return { inView, pick };
}

/** Back to the page it was opened from; opened straight from a link (Google's consent screen), to the app's start. */
function useBack() {
  const navigate = useNavigate();
  const location = useLocation();
  return () => {
    if (location.key === 'default') void navigate('/');
    else void navigate(-1);
  };
}
