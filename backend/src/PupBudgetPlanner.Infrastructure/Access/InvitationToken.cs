using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;

namespace PupBudgetPlanner.Infrastructure.Access;

/// <summary>
/// The secret in an invite link: 32 random bytes, base64url. Only its SHA-256 is stored, like a password reset
/// token, so the database alone can't be used to sign up (ADR 0016).
/// </summary>
internal static class InvitationToken
{
    private const int ByteLength = 32;

    public static string New() => WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(ByteLength));

    public static byte[] Hash(string token) => SHA256.HashData(Encoding.UTF8.GetBytes(token.Trim()));
}
