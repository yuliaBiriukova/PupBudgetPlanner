import {
  Button,
  Skeleton,
  TextInput,
  Title,
  UnstyledButton,
  useMantineColorScheme,
  type MantineColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconDeviceDesktop,
  IconInfoCircle,
  IconMoon,
  IconRefresh,
  IconSun,
  type Icon,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../shared/format/money';
import { CurrencyPicker } from '../../shared/ui/CurrencyPicker';
import { accountsQuery, accountsTotalQuery } from '../accounts/accountsApi';
import { yourCurrencies } from '../accounts/accountGroups';
import { TotalRates } from '../accounts/TotalRates';
import classes from './Settings.module.css';
import {
  settingsQuery,
  useChangeName,
  useChangeReportCurrency,
  type UserSettings,
} from './settingsApi';

/** The name's limit, as in the API (AuthLimits.DisplayNameMaxLength). */
const NAME_MAX = 50;

/** One tap away; any other NBU currency is under "Another currency" (owner, 2026-10-31). */
const QUICK_CURRENCIES = ['UAH', 'USD', 'EUR'] as const;

/**
 * Settings (F-016, final prototype variant 4): the name, the report currency and the theme, each changed where it is
 * shown. The currency and the theme are saved the moment they are picked; the name has its own Save.
 */
export function SettingsPage() {
  const { t } = useTranslation();
  const settings = useQuery(settingsQuery);

  const head = (
    <header className={classes.head}>
      <Title order={1}>{t('nav.settings')}</Title>
    </header>
  );

  if (settings.isPending) {
    return (
      <>
        {head}
        <div role="status" aria-busy="true" aria-label={t('settings.loading')}>
          {[120, 140, 80].map((width, i) => (
            <div key={width} className={classes.section}>
              <div>
                <Skeleton height={18} width={width} radius="sm" />
                <Skeleton height={14} width={200} radius="sm" mt={10} />
              </div>
              <Skeleton height={52} radius={i === 0 ? 'md' : 'xl'} maw={480} />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (settings.isError) {
    return (
      <>
        {head}
        <ErrorBanner
          text={t('settings.errors.load')}
          onRetry={() => {
            void settings.refetch();
          }}
        />
      </>
    );
  }

  return (
    <>
      {head}
      <div className={classes.page}>
        {/* A new name starts the section again, with the saved one in the field */}
        <NameSection key={settings.data.displayName} settings={settings.data} />
        <CurrencySection current={settings.data.reportCurrency} />
        <ThemeSection />
      </div>
    </>
  );
}

/** A setting: its title and a line on what it does, and the control (beside them from 1024 px). */
function Section({
  id,
  title,
  text,
  children,
}: {
  /** The title's id, so the control can be named by it. */
  id?: string;
  title: string;
  text: string;
  children: ReactNode;
}) {
  const ownId = useId();
  const titleId = id ?? ownId;
  return (
    <section className={classes.section} aria-labelledby={titleId}>
      <div className={classes.about}>
        <h2 id={titleId} className={classes.title}>
          {title}
        </h2>
        <p className={classes.text}>{text}</p>
      </div>
      <div className={classes.control}>{children}</div>
    </section>
  );
}

/** The name with Cancel and Save once it differs from the saved one; the email is shown, not changeable yet. */
function NameSection({ settings }: { settings: UserSettings }) {
  const { t } = useTranslation();
  const changeName = useChangeName();
  const [draft, setDraft] = useState(settings.displayName);
  const [error, setError] = useState<string>();
  const dirty = draft.trim() !== settings.displayName;

  const save = () => {
    const name = draft.trim();
    if (!name) {
      setError(t('settings.errors.nameRequired'));
      return;
    }
    setError(undefined);
    changeName.mutate(name, {
      onSuccess: () => notifications.show({ message: t('settings.nameSaved') }),
      onError: () => {
        setError(t('settings.errors.save'));
      },
    });
  };

  return (
    <Section title={t('settings.nameTitle')} text={t('settings.nameText')}>
      <TextInput
        label={t('settings.name')}
        value={draft}
        maxLength={NAME_MAX}
        autoComplete="name"
        error={error}
        onChange={(event) => {
          setDraft(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') save();
        }}
        classNames={{ label: classes.label, error: classes.error }}
      />
      {(dirty || error) && (
        <div className={classes.buttons}>
          <Button
            variant="quiet"
            onClick={() => {
              setDraft(settings.displayName);
              setError(undefined);
            }}
          >
            {t('settings.cancel')}
          </Button>
          <Button loading={changeName.isPending} onClick={save}>
            {t('settings.saveName')}
          </Button>
        </div>
      )}
      <dl className={classes.email}>
        <dt>{t('settings.email')}</dt>
        <dd>{settings.email}</dd>
        <dd className={classes.hint}>{t('settings.emailFixed')}</dd>
      </dl>
    </Section>
  );
}

/**
 * Hryvnia, US dollar and Euro one tap away, any other NBU currency from the shared list; saved at once, and the
 * person's total in it right under the choice.
 */
function CurrencySection({ current }: { current: string }) {
  const { t } = useTranslation();
  const accounts = useQuery(accountsQuery);
  const change = useChangeReportCurrency();
  // The pick shows at once; a failed save puts the saved one back
  const shown = change.isPending && change.variables ? change.variables : current;
  const quick = (QUICK_CURRENCIES as readonly string[]).includes(shown);
  const titleId = useId();

  const pick = (currency: string) => {
    if (currency === current && !change.isError) return;
    change.mutate(currency, {
      onSuccess: () => notifications.show({ message: t('settings.currencySaved', { currency }) }),
    });
  };

  return (
    <Section id={titleId} title={t('settings.currencyTitle')} text={t('settings.currencyText')}>
      <Choice
        name="report-currency"
        labelledBy={titleId}
        value={quick ? shown : undefined}
        options={QUICK_CURRENCIES.map((code) => ({
          value: code,
          label: t(`settings.quick.${code}`),
        }))}
        onChange={pick}
      />
      <CurrencyPicker
        label={t('settings.anotherCurrency')}
        hideLabel
        placeholder={quick ? t('settings.anotherCurrency') : undefined}
        marked={!quick}
        value={shown}
        onChange={pick}
        currencies={accounts.data?.currencies ?? []}
        yours={accounts.data ? yourCurrencies(accounts.data) : []}
        sheetTitle={t('settings.currencyTitle')}
      />
      {change.isError && (
        <ErrorBanner
          text={t('settings.errors.currency')}
          onRetry={() => {
            if (change.variables) pick(change.variables);
          }}
        />
      )}
      <YourTotal />
    </Section>
  );
}

/** "Your accounts in total" in the report currency, with the NBU rates it used (F-017's total). */
function YourTotal() {
  const { t } = useTranslation();
  const total = useQuery(accountsTotalQuery);

  if (total.isPending) {
    return (
      <Skeleton
        height={36}
        width={200}
        radius="sm"
        role="status"
        aria-label={t('accounts.rates.loading')}
      />
    );
  }
  if (total.isError) return null;

  return (
    <div className={classes.total}>
      <span className={classes.totalLabel}>{t('settings.total')}</span>
      {total.data.total === null ? (
        <p className={classes.missing}>
          <IconInfoCircle size={16} stroke={1.7} aria-hidden />
          {t('accounts.rates.missing')}
        </p>
      ) : (
        <>
          {/* The one moment: the total in the new currency comes in from below (keyed by the currency) */}
          <span className={classes.amount} aria-live="polite">
            <span key={total.data.currency} className={classes.swapIn}>
              {formatMoney(total.data.total, total.data.currency)}
            </span>
          </span>
          <TotalRates total={total.data} />
        </>
      )}
    </div>
  );
}

const THEMES: readonly { value: MantineColorScheme; icon: Icon }[] = [
  { value: 'light', icon: IconSun },
  { value: 'dark', icon: IconMoon },
  { value: 'auto', icon: IconDeviceDesktop },
];

/** Light, Dark or System; kept on this device (Mantine's own storage), so each device can have its own. */
function ThemeSection() {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const titleId = useId();

  return (
    <Section id={titleId} title={t('settings.themeTitle')} text={t('settings.themeText')}>
      <Choice
        name="theme"
        labelledBy={titleId}
        value={colorScheme}
        options={THEMES.map(({ value, icon }) => ({
          value,
          label: t(`settings.themes.${value}`),
          icon,
        }))}
        onChange={(value) => {
          setColorScheme(value as MantineColorScheme);
        }}
      />
    </Section>
  );
}

interface ChoiceProps {
  name: string;
  labelledBy: string;
  /** None is picked when undefined (Settings: a currency from the list). */
  value?: string;
  options: readonly { value: string; label: string; icon?: Icon }[];
  onChange: (value: string) => void;
}

/**
 * A segmented choice: radio buttons as pills on a track, the picked one raised (the sign-in switch's look, F-011).
 * Native radios, so the arrow keys move between them.
 */
export function Choice({ name, labelledBy, value, options, onChange }: ChoiceProps) {
  return (
    <div className={classes.choice} role="radiogroup" aria-labelledby={labelledBy}>
      {options.map(({ value: option, label, icon: OptionIcon }) => (
        <label
          key={option}
          className={classes.option}
          data-checked={option === value ? true : undefined}
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={option === value}
            className={classes.radio}
            onChange={() => {
              onChange(option);
            }}
          />
          {OptionIcon && <OptionIcon size={20} stroke={1.7} aria-hidden />}
          {label}
        </label>
      ))}
    </div>
  );
}

function ErrorBanner({ text, onRetry }: { text: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className={classes.errorBanner} role="alert">
      <IconAlertCircle size={20} stroke={1.7} aria-hidden />
      <div>
        <p>{text}</p>
        <UnstyledButton className={classes.retry} onClick={onRetry}>
          <IconRefresh size={20} stroke={1.7} aria-hidden />
          {t('settings.errors.retry')}
        </UnstyledButton>
      </div>
    </div>
  );
}
