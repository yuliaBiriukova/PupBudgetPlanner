using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using PupBudgetPlanner.Infrastructure.Reminders;

namespace PupBudgetPlanner.Infrastructure.Tests.Reminders;

public sealed class WebPushTests
{
    private static byte[] B64(string text) => Base64Url.DecodeFromChars(text);

    /// <summary>RFC 8291, Appendix A: the example's keys, salt and message give its encrypted body byte for byte.</summary>
    [Fact]
    public void The_message_is_encrypted_as_rfc_8291s_example()
    {
        var senderPublic = B64("BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8");
        using var sender = ECDiffieHellman.Create(new ECParameters
        {
            Curve = ECCurve.NamedCurves.nistP256,
            D = B64("yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw"),
            Q = new ECPoint { X = senderPublic[1..33], Y = senderPublic[33..65] },
        });

        var body = WebPush.Encrypt(
            Encoding.UTF8.GetBytes("When I grow up, I want to be a watermelon"),
            B64("BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4"),
            B64("BTBZMqHH6r4Tts7J_aSIgg"),
            sender,
            B64("DGv6ra1nlYgDCS1FRnbzlw"));

        Base64Url.EncodeToString(body).Should().Be(
            "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN");
    }

    [Fact]
    public void The_device_can_decrypt_what_was_sent_to_it()
    {
        using var device = ECDiffieHellman.Create(ECCurve.NamedCurves.nistP256);
        var point = device.ExportParameters(includePrivateParameters: false).Q;
        var devicePublic = new byte[] { 4 }.Concat(point.X!).Concat(point.Y!).ToArray();
        var auth = RandomNumberGenerator.GetBytes(16);

        var body = WebPush.Encrypt(
            """{"title":"Plan December's budget"}"""u8.ToArray(),
            Base64Url.EncodeToString(devicePublic),
            Base64Url.EncodeToString(auth));

        // The receiving side of RFC 8291: the sender's key from the header, then the same keys derived
        var salt = body[..16];
        var senderPublic = body[21..86];
        using var sender = ECDiffieHellman.Create(new ECParameters
        {
            Curve = ECCurve.NamedCurves.nistP256,
            Q = new ECPoint { X = senderPublic[1..33], Y = senderPublic[33..65] },
        });
        var shared = device.DeriveRawSecretAgreement(sender.PublicKey);
        var info = Encoding.ASCII.GetBytes("WebPush: info\0").Concat(devicePublic).Concat(senderPublic).ToArray();
        var ikm = HKDF.DeriveKey(HashAlgorithmName.SHA256, shared, 32, auth, info);
        var key = HKDF.DeriveKey(HashAlgorithmName.SHA256, ikm, 16, salt, Encoding.ASCII.GetBytes("Content-Encoding: aes128gcm\0"));
        var nonce = HKDF.DeriveKey(HashAlgorithmName.SHA256, ikm, 12, salt, Encoding.ASCII.GetBytes("Content-Encoding: nonce\0"));
        var cipher = body[86..^16];
        var plain = new byte[cipher.Length];
        using (var aes = new AesGcm(key, 16))
        {
            aes.Decrypt(nonce, cipher, body[^16..], plain);
        }

        Encoding.UTF8.GetString(plain[..^1]).Should().Be("""{"title":"Plan December's budget"}""");
        plain[^1].Should().Be(2);
    }

    [Fact]
    public void The_vapid_header_is_a_jwt_for_the_push_services_origin_signed_with_the_apps_key()
    {
        var (publicKey, privateKey) = WebPush.NewKeys();
        var now = new DateTimeOffset(2026, 12, 1, 7, 0, 0, TimeSpan.Zero);

        var header = WebPush.Vapid(
            new Uri("https://fcm.googleapis.com/fcm/send/abc"), "https://pup-budget-planner.onrender.com", publicKey,
            privateKey, now);

        header.Should().StartWith("vapid t=").And.EndWith($", k={publicKey}");
        var jwt = header["vapid t=".Length..header.IndexOf(',', StringComparison.Ordinal)].Split('.');
        using var claims = JsonDocument.Parse(B64(jwt[1]));
        claims.RootElement.GetProperty("aud").GetString().Should().Be("https://fcm.googleapis.com");
        claims.RootElement.GetProperty("sub").GetString().Should().Be("https://pup-budget-planner.onrender.com");
        claims.RootElement.GetProperty("exp").GetInt64().Should().Be(now.AddHours(12).ToUnixTimeSeconds());

        var key = B64(publicKey);
        using var verifier = ECDsa.Create(new ECParameters
        {
            Curve = ECCurve.NamedCurves.nistP256, Q = new ECPoint { X = key[1..33], Y = key[33..65] },
        });
        verifier.VerifyData(Encoding.ASCII.GetBytes($"{jwt[0]}.{jwt[1]}"), B64(jwt[2]), HashAlgorithmName.SHA256)
            .Should().BeTrue();
    }
}
