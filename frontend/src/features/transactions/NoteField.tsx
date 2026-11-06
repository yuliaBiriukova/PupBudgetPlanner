import { Combobox, TextInput, useCombobox } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FadingScrollArea } from '../../shared/ui/FadingScrollArea';
import { NOTE_MAX_LENGTH, shownNotes, splitAtTyped, SUGGESTIONS_DELAY } from './noteSuggestions';
import { scrollParentOf } from './scrollParent';
import classes from './TransactionForm.module.css';
import { noteSuggestionsQuery, type TransactionType } from './transactionsApi';

/** What was typed quiet grey, the rest of the note, what the list adds, standing out (Baymard, I-017). */
function Marked({ note, typed }: { note: string; typed: string }): ReactNode {
  const [before, match, after] = splitAtTyped(note, typed);
  if (!match) return note;
  return (
    <>
      {before}
      <span className={classes.typed}>{match}</span>
      {after}
    </>
  );
}

interface NoteFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** The form's type: an expense's notes for an expense. */
  type: TransactionType;
  placeholder: string;
  /** Enter with no suggestion picked saves the form. */
  onEnter: () => void;
  onFocus?: () => void;
  /** The list under the field shows (true) or goes (false). */
  onListed?: (listed: boolean) => void;
  /** On the phone the list hangs under the field inside the sheet, down to Save; on the desktop over the page. */
  inSheet: boolean;
}

/**
 * The Note field (I-017, final prototype): typing in it lists the person's earlier notes of the type that have what is
 * typed, in the app's dropdown under the field (above it on the desktop when there's no room below), the ones that
 * start with it first, at most 5. ↓ ↑ and Enter pick one, as do a tap or a click (on pointer down, so the field keeps
 * its focus and the phone its keyboard); Escape closes the list. Typing on without picking keeps what is typed.
 */
export function NoteField({
  id,
  value,
  onChange,
  type,
  placeholder,
  onEnter,
  onFocus,
  onListed,
  inSheet,
}: NoteFieldProps) {
  const { t } = useTranslation();
  // Typed into since it took the focus, and not closed by a pick or Escape
  const [listing, setListing] = useState(false);
  const [typed] = useDebouncedValue(value.trim(), SUGGESTIONS_DELAY);
  const notes = useQuery({
    ...noteSuggestionsQuery(type, typed),
    enabled: typed !== '' && listing,
    // The last rows stay while the next load: no spinner (final prototype)
    placeholderData: keepPreviousData,
  });
  const shown = listing ? shownNotes(notes.data ?? [], value) : [];
  const listed = shown.length > 0;
  useEffect(() => {
    onListed?.(listed);
  }, [listed, onListed]);
  // On the phone the list is the sheet's, not its scrolling form's: the form's fade at its foot stays off it, and it
  // hangs down to the form's end, where Save starts (final prototype)
  const [sheet, setSheet] = useState<{ content: HTMLElement; form: HTMLElement } | null>(null);
  const findSheet = (input: HTMLInputElement | null) => {
    const content = input?.closest<HTMLElement>('[role="dialog"]');
    const form = scrollParentOf(input ?? null);
    if (content && form && (content !== sheet?.content || form !== sheet.form))
      setSheet({ content, form });
  };
  const inPlace = inSheet && sheet;
  // Open only while it has rows: an empty list is no list, and Escape then closes the form
  const combobox = useCombobox({
    opened: listed,
    onOpenedChange: setListing,
    onDropdownClose: () => {
      combobox.resetSelectedOption();
    },
  });

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(note) => {
        onChange(note);
        setListing(false);
      }}
      withinPortal={!inSheet || !!inPlace}
      portalProps={inPlace ? { target: inPlace.content } : undefined}
      width="target"
      position="bottom-start"
      offset={4}
      // On the phone the list goes down to Save and scrolls; on the desktop it turns up above the field when the room
      // under the dialog runs out, as the app's other dropdowns do
      middlewares={{
        flip: !inSheet,
        shift: false,
        size: inPlace ? { boundary: inPlace.form, padding: 8 } : false,
      }}
      classNames={{ dropdown: classes.dropdown, option: classes.suggestion }}
    >
      <Combobox.Target>
        <TextInput
          ref={inSheet ? findSheet : undefined}
          id={id}
          value={value}
          maxLength={NOTE_MAX_LENGTH}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="done"
          onChange={(event) => {
            onChange(event.currentTarget.value);
            setListing(true);
            combobox.resetSelectedOption();
          }}
          onFocus={onFocus}
          onBlur={() => {
            setListing(false);
          }}
          onKeyDown={(event) => {
            // Enter with a suggestion picked takes it (the combobox does); otherwise it saves, as before
            if (event.key !== 'Enter') return;
            if (combobox.dropdownOpened && combobox.getSelectedOptionIndex() !== -1) return;
            event.preventDefault();
            onEnter();
          }}
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <FadingScrollArea autosize className={classes.suggestionsScroll}>
          <Combobox.Options
            className={classes.suggestions}
            aria-label={t('transactions.form.noteSuggestions')}
          >
            {shown.map((note) => (
              <Combobox.Option key={note} value={note}>
                <span className={classes.listName}>
                  <Marked note={note} typed={value} />
                </span>
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </FadingScrollArea>
      </Combobox.Dropdown>
    </Combobox>
  );
}
