using System.Buffers.Binary;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Buffers.Text;

namespace PupBudgetPlanner.Infrastructure.Reminders;

/// <summary>
/// Web push without a library (F-033, ADR 0037): the message encrypted for one device (RFC 8291, <c>aes128gcm</c> of
/// RFC 8188) and the app's VAPID signature (RFC 8292). Only .NET's own cryptography.
/// </summary>
public static class WebPush
{
    /// <summary>One record holds the whole message: the reminder is a few hundred bytes.</summary>
    private const int RecordSize = 4096;

    /// <summary>
    /// The body to post: the header (salt, record size, the sender's one-time public key) and the encrypted message.
    /// <paramref name="devicePublicKey"/> and <paramref name="authSecret"/> are the subscription's <c>p256dh</c> and
    /// <c>auth</c>, base64url.
    /// </summary>
    public static byte[] Encrypt(byte[] plaintext, string devicePublicKey, string authSecret)
    {
        using var sender = ECDiffieHellman.Create(ECCurve.NamedCurves.nistP256);
        return Encrypt(
            plaintext,
            Base64Url.DecodeFromChars(devicePublicKey),
            Base64Url.DecodeFromChars(authSecret),
            sender,
            RandomNumberGenerator.GetBytes(16));
    }

    /// <summary>The same with the sender's key and the salt given: what RFC 8291's example checks.</summary>
    public static byte[] Encrypt(
        byte[] plaintext, byte[] devicePublicKey, byte[] authSecret, ECDiffieHellman sender, byte[] salt)
    {
        using var device = ImportPublic(devicePublicKey);
        var senderPublic = PublicKeyOf(sender);
        var shared = sender.DeriveRawSecretAgreement(device.PublicKey);

        // IKM from the shared secret, the device's auth secret and both public keys (RFC 8291 §3.4)
        var keyInfo = Concat(Encoding.ASCII.GetBytes("WebPush: info\0"), devicePublicKey, senderPublic);
        var ikm = HKDF.DeriveKey(HashAlgorithmName.SHA256, shared, 32, authSecret, keyInfo);
        var key = HKDF.DeriveKey(
            HashAlgorithmName.SHA256, ikm, 16, salt, Encoding.ASCII.GetBytes("Content-Encoding: aes128gcm\0"));
        var nonce = HKDF.DeriveKey(
            HashAlgorithmName.SHA256, ikm, 12, salt, Encoding.ASCII.GetBytes("Content-Encoding: nonce\0"));

        // The last (and only) record ends with the delimiter 2 (RFC 8188 §2)
        var padded = Concat(plaintext, [2]);
        var cipher = new byte[padded.Length];
        var tag = new byte[16];
        using (var aes = new AesGcm(key, tag.Length))
        {
            aes.Encrypt(nonce, padded, cipher, tag);
        }

        var header = new byte[16 + 4 + 1 + senderPublic.Length];
        salt.CopyTo(header, 0);
        BinaryPrimitives.WriteUInt32BigEndian(header.AsSpan(16), RecordSize);
        header[20] = (byte)senderPublic.Length;
        senderPublic.CopyTo(header, 21);
        return Concat(header, cipher, tag);
    }

    /// <summary>
    /// The <c>Authorization</c> header's value for a push service (RFC 8292): a JWT for the endpoint's origin, valid
    /// 12 hours, signed with the app's private key, and the public key.
    /// </summary>
    public static string Vapid(Uri endpoint, string subject, string publicKey, string privateKey, DateTimeOffset now)
    {
        var header = Base64Url.EncodeToString("""{"typ":"JWT","alg":"ES256"}"""u8.ToArray());
        var claims = Base64Url.EncodeToString(JsonSerializer.SerializeToUtf8Bytes(new Dictionary<string, object>
        {
            ["aud"] = endpoint.GetLeftPart(UriPartial.Authority),
            ["exp"] = now.AddHours(12).ToUnixTimeSeconds(),
            ["sub"] = subject,
        }));
        var signed = $"{header}.{claims}";

        var publicBytes = Base64Url.DecodeFromChars(publicKey);
        using var signer = ECDsa.Create(new ECParameters
        {
            Curve = ECCurve.NamedCurves.nistP256,
            D = Base64Url.DecodeFromChars(privateKey),
            Q = new ECPoint { X = publicBytes[1..33], Y = publicBytes[33..65] },
        });
        // ES256 is r and s side by side (IEEE P1363), .NET's own format
        var signature = signer.SignData(Encoding.ASCII.GetBytes(signed), HashAlgorithmName.SHA256);
        return $"vapid t={signed}.{Base64Url.EncodeToString(signature)}, k={publicKey}";
    }

    /// <summary>A new VAPID key pair, base64url: the public key uncompressed (65 bytes) and the private one (32).</summary>
    public static (string PublicKey, string PrivateKey) NewKeys()
    {
        using var key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        var parameters = key.ExportParameters(includePrivateParameters: true);
        return (
            Base64Url.EncodeToString(Concat([4], parameters.Q.X!, parameters.Q.Y!)),
            Base64Url.EncodeToString(parameters.D!));
    }

    private static ECDiffieHellman ImportPublic(byte[] uncompressed)
    {
        if (uncompressed.Length != 65 || uncompressed[0] != 4)
        {
            throw new CryptographicException("The device's key isn't an uncompressed P-256 point.");
        }

        return ECDiffieHellman.Create(new ECParameters
        {
            Curve = ECCurve.NamedCurves.nistP256,
            Q = new ECPoint { X = uncompressed[1..33], Y = uncompressed[33..65] },
        });
    }

    private static byte[] PublicKeyOf(ECDiffieHellman key)
    {
        var point = key.ExportParameters(includePrivateParameters: false).Q;
        return Concat([4], point.X!, point.Y!);
    }

    private static byte[] Concat(params byte[][] parts)
    {
        var all = new byte[parts.Sum(part => part.Length)];
        var at = 0;
        foreach (var part in parts)
        {
            part.CopyTo(all, at);
            at += part.Length;
        }

        return all;
    }
}
