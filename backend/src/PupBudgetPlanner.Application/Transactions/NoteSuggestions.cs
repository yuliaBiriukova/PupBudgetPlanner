namespace PupBudgetPlanner.Application.Transactions;

/// <summary>One note as the person wrote it, how many transactions have it and when the last of them was added.</summary>
public sealed record UsedNote(string Note, int Uses, DateTimeOffset LastUsed);

/// <summary>
/// The person's earlier notes that have what is typed in the Note field (I-017): the ones that start with it first, then
/// the ones that have it further on; within each, the most used first, then the one used last. Case is ignored, in
/// Ukrainian too, so "silpo" and "Silpo" are one note, written as it was the last time. Pure, so it is tested without a
/// database.
/// </summary>
public static class NoteSuggestions
{
    /// <summary>The most the list under the field shows (owner, 2026-11-04).</summary>
    public const int MaxCount = 5;

    public static IReadOnlyList<UsedNote> Of(IEnumerable<UsedNote> used, string? typed)
    {
        var text = typed?.Trim() ?? "";
        if (text.Length == 0)
        {
            return [];
        }

        return used
            .Where(note => note.Note.Contains(text, StringComparison.OrdinalIgnoreCase))
            .GroupBy(note => note.Note, StringComparer.OrdinalIgnoreCase)
            .Select(same => new UsedNote(
                same.MaxBy(note => note.LastUsed)!.Note,
                same.Sum(note => note.Uses),
                same.Max(note => note.LastUsed)))
            // What is typed already is no suggestion
            .Where(note => !note.Note.Equals(text, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(note => note.Note.StartsWith(text, StringComparison.OrdinalIgnoreCase))
            .ThenByDescending(note => note.Uses)
            .ThenByDescending(note => note.LastUsed)
            .Take(MaxCount)
            .ToList();
    }
}
