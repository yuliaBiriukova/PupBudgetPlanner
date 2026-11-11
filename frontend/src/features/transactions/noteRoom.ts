/** The gap between the Note and its list on the phone (the list's offset). */
export const LIST_GAP = 4;

/** What the list keeps clear above Save on the phone (its size limit's padding). */
export const LIST_FOOT = 8;

/**
 * How high the empty room under the form is while the Note's earlier notes are listed on the phone (B-014): what the
 * list needs under the Note beyond the part of the form already there, so Save comes right after the list, and never
 * more than lets the Note reach the top of the sheet (B-009), where a longer list scrolls inside.
 *
 * @param list The list's height with all its rows.
 * @param under The form's height under the Note (with no room).
 * @param most The room that brings the Note to the top of the sheet.
 */
export function noteRoomHeight(list: number, under: number, most: number): number {
  return Math.max(0, Math.min(list + LIST_GAP + LIST_FOOT - under, most));
}
