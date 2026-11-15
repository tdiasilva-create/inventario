using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Semed.Agent.Crypto;
using Semed.Agent.Engine;
using Semed.Agent.Inventory;
using Semed.Agent.Protocol;
using Semed.Agent.Qr;
using Semed.Agent.Queue;

namespace Semed.Agent.Tests;

public static class CryptoTests
{
    [Test]
    public static void Base64Url_roundtrip_e_rejeita_nao_canonico()
    {
        var data = RandomNumberGenerator.GetBytes(64);
        var s = Base64Url.Encode(data);
        Assert.False(s.Contains('=') || s.Contains('+') || s.Contains('/'));
        Assert.True(Base64Url.Decode(s).AsSpan().SequenceEqual(data));
        Assert.Throws<FormatException>(() => Base64Url.Decode("AB=="));
        Assert.Throws<FormatException>(() => Base64Url.Decode("AQ+/"));
        Assert.Throws<FormatException>(() => Base64Url.Decode("AR")); // bits sobrando: não canônico
    }

    [Test]
    public static void String_canonica_tem_5_linhas_sem_LF_final()
    {
        var c = RequestSigner.Canonical("post", "/api/agent/v1/heartbeat", 1793728800, "nonce_teste_0000000000", "{}"u8);
        var lines = c.Split('\n');
        Assert.Equal(5, lines.Length);
        Assert.Equal("POST", lines[0]);
        Assert.Equal("44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a", lines[4]);
        Assert.False(c.EndsWith('\n'));
        Assert.Throws<ArgumentException>(() => RequestSigner.Canonical("POST", "/x?y=1", 1, "n", "{}"u8));
    }

    [Test]
    public static void Assinatura_P1363_64_bytes_e_verificacao()
    {
        using var key = new EcdsaSigningKey(ECDsa.Create(ECCurve.NamedCurves.nistP256));
        var body = Encoding.UTF8.GetBytes("{\"a\":\"ção\"}");
        var h = RequestSigner.Sign(key, "POST", "/api/agent/v1/inventory", body, 1793728800);
        Assert.Equal(86, h.Signature.Length);
        var canonical = RequestSigner.Canonical("POST", "/api/agent/v1/inventory", 1793728800, h.Nonce, body);
        Assert.True(RequestSigner.Verify(key.PublicJwk, canonical, h.Signature));
        var tampered = RequestSigner.Canonical("POST", "/api/agent/v1/inventory", 1793728800, h.Nonce, Encoding.UTF8.GetBytes("{\"a\":\"cao\"}"));
        Assert.False(RequestSigner.Verify(key.PublicJwk, tampered, h.Signature));
        Assert.Equal(43, key.KeyId.Length);
    }

    [Test]
    public static void Thumbprint_RFC7638_vetor_publico()
    {
        // Chave de exemplo RFC 7517 A.1; thumbprint calculado de forma independente pelo Web Crypto (ver test-vectors).
        var jwk = new PublicJwk("EC", "P-256", "MKBCTNIcKUSDii11ySs3526iDZ8AiTo7Tu6KPAqv7D4", "4Etl6SRW2YiLUrN5vfvVHuhp7x8PxltmWWlbbM4IFyM");
        var expected = Base64Url.Encode(SHA256.HashData(Encoding.UTF8.GetBytes(
            "{\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"MKBCTNIcKUSDii11ySs3526iDZ8AiTo7Tu6KPAqv7D4\",\"y\":\"4Etl6SRW2YiLUrN5vfvVHuhp7x8PxltmWWlbbM4IFyM\"}")));
        Assert.Equal(expected, jwk.Thumbprint());
    }

    [Test]
    public static void Armazenamento_inseguro_exige_confirmacao()
    {
        Assert.Throws<InvalidOperationException>(() => new InsecureFileKeyStore(Path.GetTempPath(), false));
    }
}

public static class NormalizationTests
{
    [Test]
    public static void Identificadores_genericos_nao_viram_identidade()
    {
        foreach (var g in new[] { "To Be Filled By O.E.M.", "Default string", "  0000000000  ", "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF",
                     "00000000-0000-0000-0000-000000000000", "System Serial Number", "03000200-0400-0500-0006-000700080009", "N/A" })
        {
            var id = Normalization.Identifier(g);
            Assert.Equal(Reliability.Generic, id.Reliability, g);
            Assert.True(id.Value is not null, "valor bruto preservado");
        }
        Assert.Equal(Reliability.Absent, Normalization.Identifier("   ").Reliability);
        Assert.Equal(Reliability.Absent, Normalization.Identifier(null).Reliability);
        Assert.Equal(Reliability.Ok, Normalization.Identifier("PF3ABCDE").Reliability);
    }

    [Test]
    public static void Dica_de_serie_mostra_no_maximo_4_caracteres()
    {
        Assert.Equal("••••CDEF", Normalization.SerialHint(new Identifier("XYZ12ABCDEF", Reliability.Ok)));
        Assert.Equal(null, Normalization.SerialHint(new Identifier("Default string", Reliability.Generic)));
    }

    [Test]
    public static void MAC_normalizado()
    {
        Assert.Equal("0A:1B:2C:3D:4E:5F", Normalization.Mac("0a-1b-2c-3d-4e-5f"));
        Assert.Equal(null, Normalization.Mac("xyz"));
    }

    [Test]
    public static void Hash_ignora_ordem_e_campos_dinamicos()
    {
        var src = new SimulatedInventorySource(null);
        var a = src.Collect(CollectionOptions.Default, default);
        var b = src.Collect(CollectionOptions.Default, default); // free_bytes aleatório diferente
        var ha = ContentHash.Compute(a);
        var hb = ContentHash.Compute(b);
        Assert.Equal(ha.ContentHash, hb.ContentHash, "espaço livre não muda hash");

        var dir = Directory.CreateTempSubdirectory().FullName;
        File.WriteAllText(Path.Combine(dir, "sim.json"), "{\"memory_modules_gb\":[8,4],\"reorder\":false}");
        var s1 = new SimulatedInventorySource(Path.Combine(dir, "sim.json")).Collect(CollectionOptions.Default, default);
        File.WriteAllText(Path.Combine(dir, "sim.json"), "{\"memory_modules_gb\":[8,4],\"reorder\":true}");
        var s2 = new SimulatedInventorySource(Path.Combine(dir, "sim.json")).Collect(CollectionOptions.Default, default);
        Assert.Equal(ContentHash.Compute(s1).SectionHashes["memory"], ContentHash.Compute(s2).SectionHashes["memory"], "reordenar módulos");
        Assert.Equal(ContentHash.Compute(s1).SectionHashes["storage"], ContentHash.Compute(s2).SectionHashes["storage"], "reordenar discos");
        Assert.NotEqual(ha.SectionHashes["memory"], ContentHash.Compute(s1).SectionHashes["memory"], "adicionar RAM muda hash");
    }

    [Test]
    public static void Falha_de_leitura_nao_e_remocao_de_peca()
    {
        var dir = Directory.CreateTempSubdirectory().FullName;
        var p = Path.Combine(dir, "sim.json");
        var okInv = new SimulatedInventorySource(p).Collect(CollectionOptions.Default, default);
        File.WriteAllText(p, "{\"storage_quality\":\"timeout\"}");
        var failed = new SimulatedInventorySource(p).Collect(CollectionOptions.Default, default);
        var a = ContentHash.Compute(okInv);
        var b = ContentHash.Compute(failed);
        var changes = ContentHash.SuspectedHardwareChanges(a.SectionHashes, okInv.ToDictionary(k => k.Key, v => v.Value.Quality), b.SectionHashes, failed.ToDictionary(k => k.Key, v => v.Value.Quality));
        Assert.Equal(0, changes.Count, "timeout não gera suspeita");
        Assert.NotEqual(a.ContentHash, b.ContentHash, "mas o snapshot com qualidade diferente é reenviado");
    }

    [Test]
    public static void Canonicalizacao_ordena_chaves()
    {
        Assert.Equal("{\"a\":1,\"b\":[1,2]}", ContentHash.Canonicalize(JsonNode.Parse("{\"b\":[2,1],\"a\":1}")));
    }
}

public static class ProtocolTests
{
    [Test]
    public static void Json_snake_case_e_nulos_explicitos()
    {
        var hb = new HeartbeatMessage { MessageId = "m", InstallationId = "i", BootId = "b", Sequence = 1, CollectedAt = "x", AgentVersion = "v" };
        var json = Encoding.UTF8.GetString(AgentJson.SerializeToUtf8(hb));
        Assert.True(json.Contains("\"protocol_version\":\"1.0\""));
        Assert.True(json.Contains("\"latest_inventory_id\":null"));
        Assert.True(json.Contains("\"pending_messages\":0"));
        var acc = Encoding.UTF8.GetString(AgentJson.SerializeToUtf8(new AccountsData()));
        Assert.True(acc.Contains("\"named_accounts_collected\":false"));
    }

    [Test]
    public static void Politica_do_servidor_e_limitada_pelo_agente()
    {
        var p = new AgentPolicy { HeartbeatIntervalSeconds = 1, InventoryIntervalSeconds = 1, CollectNamedAccounts = true, HeartbeatJitterPercent = 500 }.Clamped();
        Assert.Equal(60, p.HeartbeatIntervalSeconds);
        Assert.Equal(900, p.InventoryIntervalSeconds);
        Assert.Equal(50, p.HeartbeatJitterPercent);
        Assert.False(p.CollectNamedAccounts, "coleta nominal nunca liga por configuração remota");
    }

    [Test]
    public static void Config_exige_https_exceto_loopback_explicito()
    {
        Assert.Throws<InvalidOperationException>(() => new AgentConfig { ApiBaseUrl = "http://exemplo.invalid" }.Validate());
        Assert.Throws<InvalidOperationException>(() => new AgentConfig { ApiBaseUrl = "http://127.0.0.1:8787" }.Validate());
        new AgentConfig { ApiBaseUrl = "http://127.0.0.1:8787", AllowInsecureLoopback = true }.Validate();
        Assert.Throws<InvalidOperationException>(() => new AgentConfig { ApiBaseUrl = "http://192.168.0.10", AllowInsecureLoopback = true }.Validate());
        Assert.Throws<InvalidOperationException>(() => new AgentConfig { ApiBaseUrl = "https://u:p@exemplo.invalid" }.Validate());
        new AgentConfig { ApiBaseUrl = "https://exemplo.invalid/base" }.Validate();
    }

    [Test]
    public static void Payload_do_QR_cabe_e_tem_campos_do_contrato()
    {
        var t = new PairingTicket { EnrollmentId = Guid.NewGuid().ToString(), PairingCode = Base64Url.RandomToken(16), VisualCode = "ABC-DEF", ExpiresAt = "2026-11-03T18:10:00Z" };
        var json = AgentEngine.QrPayloadJson(t);
        var doc = JsonDocument.Parse(json).RootElement;
        Assert.Equal("semed.agent.pairing", doc.GetProperty("type").GetString());
        Assert.Equal(1, doc.GetProperty("version").GetInt32());
        Assert.False(json.Contains("visual"), "código visual não vai no QR");
        Assert.True(Encoding.UTF8.GetByteCount(json) < 512);
    }
}

public static class QueueTests
{
    private static string TempDir() => Directory.CreateTempSubdirectory("semedq").FullName;

    [Test]
    public static void Item_so_sai_com_ACK_do_mesmo_id()
    {
        var q = new DurableQueue(TempDir());
        q.Enqueue(MessageKind.Inventory, "p", "id-1", "{\"x\":1}", DateTimeOffset.UtcNow);
        var item = q.Pending().Single();
        Assert.Throws<InvalidOperationException>(() => q.Acknowledge(item, "id-2"));
        Assert.Equal(1, q.Count);
        q.Acknowledge(item, "id-1");
        Assert.Equal(0, q.Count);
    }

    [Test]
    public static void Corpo_preservado_byte_a_byte_entre_tentativas()
    {
        var q = new DurableQueue(TempDir());
        const string body = "{\"b\":\"ção — ü\",\"a\":1}";
        q.Enqueue(MessageKind.Inventory, "p", "id-1", body, DateTimeOffset.UtcNow);
        var item = q.Pending().Single();
        q.RecordAttempt(item, "TIMEOUT");
        var again = q.Pending().Single();
        Assert.Equal(body, again.Body);
        Assert.Equal(1, again.Attempts);
        Assert.Equal("id-1", again.MessageId);
    }

    [Test]
    public static void Heartbeats_antigos_sao_compactados_e_contados()
    {
        var q = new DurableQueue(TempDir());
        var t = DateTimeOffset.UtcNow;
        for (var i = 0; i < 5; i++) q.Enqueue(MessageKind.Heartbeat, "p", $"hb-{i}", "{}", t.AddSeconds(i));
        q.Enqueue(MessageKind.Inventory, "p", "inv", "{}", t.AddSeconds(10));
        Assert.Equal(2, q.Count);
        Assert.Equal(4L, q.Stats.CompactedHeartbeats);
        Assert.Equal("hb-4", q.Pending().First(i => i.Kind == MessageKind.Heartbeat).MessageId);
    }

    [Test]
    public static void Limite_de_inventarios_descarta_com_contagem_preservando_primeiro_e_ultimo()
    {
        var q = new DurableQueue(TempDir()) { MaxInventories = 3 };
        var t = DateTimeOffset.UtcNow;
        for (var i = 0; i < 6; i++) q.Enqueue(MessageKind.Inventory, "p", $"inv-{i}", "{}", t.AddSeconds(i));
        var ids = q.Pending().Select(i => i.MessageId).ToList();
        Assert.Equal(3, ids.Count);
        Assert.Equal("inv-0", ids[0]);
        Assert.Equal("inv-5", ids[^1]);
        Assert.Equal(3L, q.Stats.DroppedInventories);
    }

    [Test]
    public static void Arquivo_corrompido_vai_para_quarentena_e_temporario_orfao_e_limpo()
    {
        var dir = TempDir();
        var q = new DurableQueue(dir);
        q.Enqueue(MessageKind.Inventory, "p", "ok", "{}", DateTimeOffset.UtcNow);
        File.WriteAllText(Path.Combine(dir, "00000000000000000001.inventory.bad.msg.json"), "{corrompido");
        File.WriteAllText(Path.Combine(dir, ".tmp-orfao"), "parcial");
        var q2 = new DurableQueue(dir); // reinício
        Assert.False(File.Exists(Path.Combine(dir, ".tmp-orfao")));
        var items = q2.Pending();
        Assert.Equal(1, items.Count);
        Assert.Equal(1L, q2.Stats.Corrupt);
        Assert.True(Directory.EnumerateFiles(Path.Combine(dir, "corrupt")).Any());
    }

    [Test]
    public static void Rejeitado_vai_para_quarentena_nao_e_apagado()
    {
        var dir = TempDir();
        var q = new DurableQueue(dir);
        q.Enqueue(MessageKind.Inventory, "p", "x", "{}", DateTimeOffset.UtcNow);
        q.Quarantine(q.Pending().Single(), conflict: true, "MESSAGE_ID_CONFLICT");
        Assert.Equal(0, q.Count);
        Assert.Equal(1, Directory.EnumerateFiles(Path.Combine(dir, "conflict")).Count());
        Assert.Equal(1L, q.Stats.Conflicts);
    }
}

public static class QrTests
{
    [Test]
    public static void Qr_versao_e_tamanho_plausiveis()
    {
        var payload = AgentEngine.QrPayloadJson(new PairingTicket { EnrollmentId = Guid.NewGuid().ToString(), PairingCode = Base64Url.RandomToken(16), ExpiresAt = "2026-11-03T18:10:00Z" });
        var qr = QrCode.EncodeText(payload, QrCode.Ecc.M);
        Assert.True(qr.Version is >= 8 and <= 10, $"versão {qr.Version}");
        Assert.Equal(qr.Version * 4 + 17, qr.Size);
        // Padrões de localização nos três cantos.
        Assert.True(qr[0, 0] && qr[6, 0] && qr[0, 6] && !qr[1, 1] && qr[3, 3]);
        Assert.True(qr[qr.Size - 1, 0] && qr[0, qr.Size - 1]);
    }
}
