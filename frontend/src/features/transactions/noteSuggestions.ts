/** The longest note the API keeps (`Transaction.NoteMaxLength`). */
export const NOTE_MAX_LENGTH = 200;

/** The most suggestions the list shows (`NoteSuggestions.MaxCount`, owner, 2026-11-04). */
export const MAX_SUGGESTIONS = 5;

/** The pause in typing before the notes are asked for. */
export const SUGGESTIONS_DELAY = 200;

/** Case ignored, in Ukrainian too. */
export const fold = (text: string) => text.toLocaleLowerCase('uk');

/**
 * The notes the list shows for what is typed (I-017): the ones that have it, not the one that is it. The API's answer is
 * for what was typed a moment ago, so the list keeps it while the next one loads, without those that no longer fit.
 */
export function shownNotes(notes: readonly string[], typed: string): string[] {
  const text = fold(typed.trim());
  if (!text) return [];
  return notes
    .filter((note) => fold(note).includes(text) && fold(note) !== text)
    .slice(0, MAX_SUGGESTIONS);
}

/**
 * A note in three parts: before what was typed, what was typed (quiet grey in the list), and after it. All of it in the
 * first part when the typed text isn't in it, or folding the case changes a letter's length.
 */
export function splitAtTyped(note: string, typed: string): [string, string, string] {
  const text = typed.trim();
  const at = fold(note).indexOf(fold(text));
  if (!text || at < 0 || fold(note).length !== note.length) return [note, '', ''];
  return [note.slice(0, at), note.slice(at, at + text.length), note.slice(at + text.length)];
}
