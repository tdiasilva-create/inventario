using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Semed.Agent.Crypto;
using Semed.Agent.Engine;
using Semed.Agent.Inventory;
using Semed.Agent.Protocol;
using Semed.Agent.Qr;

namespace Semed.Agent.Tests;

/// <summary>
/// Vetores de interoperabilidade. Lê a parte gerada pelo Web Crypto, verifica cada caso com .NET,
/// acrescenta casos assinados pelo .NET e grava o arquivo final (verificado depois pelo Node).
/// AS CHAVES SÃO EXCLUSIVAS DE TESTE e publicadas de propósito.
/// </summary>
public static class Vectors
{
    public static int Run(string webcryptoPart, string outPath)
    {
        var root = JsonNode.Parse(File.ReadAllText(webcryptoPart))!.AsObject();
        var keys = root["keys"]!.AsArray();
        var cases = root["cases"]!.AsArray();
        var failures = 0;

        // 1) Verifica casos do Web Crypto.
        foreach (var c in cases.Select(x => x!))
        {
            var key = keys.First(k => k!["name"]!.GetValue<string>() == c!["key"]!.GetValue<string>())!;
            var jwk = new PublicJwk("EC", "P-256", key["public_jwk"]!["x"]!.GetValue<string>(), key["public_jwk"]!["y"]!.GetValue<string>());
            if (jwk.Thumbprint() != key["key_id"]!.GetValue<string>()) { Console.WriteLine($"FALHA thumbprint {key["name"]}"); failures++; }
            var body = Encoding.UTF8.GetBytes(c["body"]!.GetValue<string>());
            if (RequestSigner.Sha256Hex(body) != c["body_sha256_hex"]!.GetValue<string>()) { Console.WriteLine($"FALHA hash {c["name"]}"); failures++; }
            var canonical = RequestSigner.Canonical(c["method"]!.GetValue<string>(), c["path"]!.GetValue<string>(), c["timestamp"]!.GetValue<long>(), c["nonce"]!.GetValue<string>(), body);
            if (canonical != c["canonical"]!.GetValue<string>()) { Console.WriteLine($"FALHA canonical {c["name"]}"); failures++; }
            var ok = RequestSigner.Verify(jwk, canonical, c["signature"]!.GetValue<string>());
            var expect = c["expect_valid"]!.GetValue<bool>();
            if (ok != expect) { Console.WriteLine($"FALHA verificação .NET {c["name"]}: {ok} != {expect}"); failures++; }
            else Console.WriteLine($"  ok   .NET verificou {c["name"]} ({(expect ? "válida" : "inválida")})");
        }

        // 2) Acrescenta casos assinados pelo .NET com chave de teste determinística por arquivo.
        using var ecdsa = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        using var sk = new EcdsaSigningKey(ECDsa.Create(ecdsa.ExportParameters(true)));
        var pkcs8 = Base64Url.Encode(ecdsa.ExportPkcs8PrivateKey());
        keys.Add(new JsonObject
        {
            ["name"] = "dotnet-test-key",
            ["warning"] = "CHAVE EXCLUSIVA DE TESTE — publicada de propósito, nunca usar em produção",
            ["private_pkcs8_b64url"] = pkcs8,
            ["public_jwk"] = new JsonObject { ["kty"] = "EC", ["crv"] = "P-256", ["x"] = sk.PublicJwk.X, ["y"] = sk.PublicJwk.Y },
            ["key_id"] = sk.KeyId,
        });
        var templates = cases.Where(c => c!["signer"]!.GetValue<string>() == "webcrypto" && c["expect_valid"]!.GetValue<bool>()).ToList();
        foreach (var t in templates)
        {
            var body = Encoding.UTF8.GetBytes(t!["body"]!.GetValue<string>());
            var ts = t["timestamp"]!.GetValue<long>();
            var nonce = t["nonce"]!.GetValue<string>();
            var path = t["path"]!.GetValue<string>();
            var method = t["method"]!.GetValue<string>();
            var h = RequestSigner.Sign(sk, method, path, body, ts, nonce);
            cases.Add(new JsonObject
            {
                ["name"] = "dotnet:" + t["name"]!.GetValue<string>().Replace("webcrypto:", ""),
                ["signer"] = "dotnet",
                ["key"] = "dotnet-test-key",
                ["method"] = method,
                ["path"] = path,
                ["timestamp"] = ts,
                ["nonce"] = nonce,
                ["body"] = t["body"]!.GetValue<string>(),
                ["body_sha256_hex"] = RequestSigner.Sha256Hex(body),
                ["canonical"] = RequestSigner.Canonical(method, path, ts, nonce, body),
                ["signature"] = h.Signature,
                ["expect_valid"] = true,
            });
        }
        // Negativo .NET: assinatura DER (formato errado) deve ser recusada pelos dois lados.
        {
            var t = templates[0]!;
            var body = Encoding.UTF8.GetBytes(t["body"]!.GetValue<string>());
            var canonical = t["canonical"]!.GetValue<string>();
            var der = ecdsa.SignData(Encoding.UTF8.GetBytes(canonical), HashAlgorithmName.SHA256, DSASignatureFormat.Rfc3279DerSequence);
            cases.Add(new JsonObject
            {
                ["name"] = "dotnet:negativo-assinatura-DER", ["signer"] = "dotnet", ["key"] = "dotnet-test-key",
                ["method"] = t["method"]!.GetValue<string>(), ["path"] = t["path"]!.GetValue<string>(), ["timestamp"] = t["timestamp"]!.GetValue<long>(),
                ["nonce"] = t["nonce"]!.GetValue<string>(), ["body"] = t["body"]!.GetValue<string>(), ["body_sha256_hex"] = RequestSigner.Sha256Hex(body),
                ["canonical"] = canonical, ["signature"] = Base64Url.Encode(der), ["expect_valid"] = false,
            });
        }
        root["generated_by"] = "webcrypto (Node) + .NET " + Environment.Version;
        File.WriteAllText(outPath, root.ToJsonString(new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }) + "\n");
        Console.WriteLine(failures == 0 ? $"vetores gravados em {outPath}" : $"{failures} falha(s)");
        return failures == 0 ? 0 : 1;
    }
}

/// <summary>Exporta matrizes QR para decodificação independente (jsQR no Node).</summary>
public static class QrExport
{
    public static int Run(string outPath)
    {
        var list = new JsonArray();
        var payloads = new List<string>
        {
            AgentEngine.QrPayloadJson(new PairingTicket { EnrollmentId = "77777777-7777-4777-8777-777777777777", PairingCode = "EXEMPLO_FICTICIO_NAO_USAR", ExpiresAt = "2026-11-03T18:10:00Z" }),
            "TESTE",
            "Teste com acentuação: ação, ç, ü — QR byte mode",
            new string('A', 300),
        };
        for (var i = 0; i < 5; i++)
            payloads.Add(AgentEngine.QrPayloadJson(new PairingTicket { EnrollmentId = Guid.NewGuid().ToString(), PairingCode = Base64Url.RandomToken(16), ExpiresAt = "2026-11-03T18:10:00Z" }));
        foreach (var p in payloads)
        foreach (var ecc in new[] { QrCode.Ecc.M, QrCode.Ecc.L, QrCode.Ecc.Q, QrCode.Ecc.H })
        {
            var qr = QrCode.EncodeText(p, ecc);
            list.Add(new JsonObject { ["text"] = p, ["ecc"] = ecc.ToString(), ["version"] = qr.Version, ["mask"] = qr.Mask, ["rows"] = new JsonArray(qr.ToRows().Select(r => (JsonNode)r).ToArray()) });
        }
        // Todas as máscaras forçadas, para cobrir as 8 fórmulas.
        for (var m = 0; m < 8; m++)
        {
            var qr = QrCode.EncodeText(payloads[0], QrCode.Ecc.M, mask: m);
            list.Add(new JsonObject { ["text"] = payloads[0], ["ecc"] = "M", ["version"] = qr.Version, ["mask"] = m, ["rows"] = new JsonArray(qr.ToRows().Select(r => (JsonNode)r).ToArray()) });
        }
        File.WriteAllText(outPath, list.ToJsonString());
        Console.WriteLine($"{list.Count} matrizes QR gravadas em {outPath}");
        return 0;
    }
}

/// <summary>Grava heartbeat e inventário REAIS serializados pelo agente (coletor simulado) para validação no JSON Schema.</summary>
public static class Samples
{
    public static int Run(string dir)
    {
        Directory.CreateDirectory(dir);
        var src = new SimulatedInventorySource(null);
        var sections = src.Collect(CollectionOptions.Default, default);
        var inv = new InventoryMessage
        {
            MessageId = Guid.NewGuid().ToString(), InventoryId = Guid.NewGuid().ToString(), InstallationId = Guid.NewGuid().ToString(),
            BootId = Guid.NewGuid().ToString(), Sequence = 2, CollectedAt = Util.Iso.Format(DateTimeOffset.UtcNow), PreviousInventoryId = null,
            AgentVersion = "0.1.0-test", CollectorVersion = src.CollectorVersion, Reason = "startup", ContentHash = ContentHash.Compute(sections).ContentHash,
            Sections = sections,
            QueueGaps = [new Queue.QueueGap { GapId = Guid.NewGuid().ToString("D"), DroppedCount = 2, DroppedChangeCount = 1, FirstDroppedCollectedAt = "2026-11-01T00:00:00Z", LastDroppedCollectedAt = "2026-11-02T00:00:00Z" }],
        };
        File.WriteAllBytes(Path.Combine(dir, "agent-inventory.json"), AgentJson.SerializeToUtf8(inv));
        var hb = new HeartbeatMessage
        {
            MessageId = Guid.NewGuid().ToString(), InstallationId = inv.InstallationId, BootId = inv.BootId, Sequence = 3, CollectedAt = inv.CollectedAt,
            AgentVersion = "0.1.0-test", UptimeSeconds = 100, Reason = "periodic", Health = new HeartbeatHealth { Inventory = "ok" }, LatestInventoryId = inv.InventoryId,
            Performance = src.SamplePerformance(default),
        };
        File.WriteAllBytes(Path.Combine(dir, "agent-heartbeat.json"), AgentJson.SerializeToUtf8(hb));
        Console.WriteLine($"amostras gravadas em {dir}");
        return 0;
    }
}
