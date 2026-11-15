using System.Diagnostics;
using System.Net;
using System.Text;
using Semed.Agent.Crypto;
using Semed.Agent.Engine;
using Semed.Agent.Inventory;
using Semed.Agent.Protocol;
using Semed.Agent.Queue;
using Semed.Agent.Util;

namespace Semed.Agent.Tests;

/// <summary>Regressões dos achados 4.A, 4.B e 4.C da revisão 0.1.1 (03/11/2026).</summary>
public static class Revisao011Tests
{
    private static string TempDir() => Directory.CreateTempSubdirectory("semed011").FullName;
    private static AgentConfig Loopback() => new() { ApiBaseUrl = "http://127.0.0.1:9", AllowInsecureLoopback = true };

    private sealed class FixedHandler(Func<HttpResponseMessage> make) : HttpMessageHandler
    {
        public int Calls;
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Interlocked.Increment(ref Calls);
            return Task.FromResult(make());
        }
    }

    /// <summary>Cabeçalhos chegam; o corpo NUNCA chega.</summary>
    private sealed class NeverStream : Stream
    {
        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new NotSupportedException();
        public override long Position { get => 0; set => throw new NotSupportedException(); }
        public override int Read(byte[] b, int o, int c) => throw new NotSupportedException("somente assíncrono");
        public override async ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken ct = default)
        {
            await Task.Delay(Timeout.Infinite, ct);
            return 0;
        }
        public override Task<int> ReadAsync(byte[] b, int o, int c, CancellationToken ct) => ReadAsync(b.AsMemory(o, c), ct).AsTask();
        public override void Flush() { }
        public override long Seek(long o, SeekOrigin s) => throw new NotSupportedException();
        public override void SetLength(long v) => throw new NotSupportedException();
        public override void Write(byte[] b, int o, int c) => throw new NotSupportedException();
    }

    /// <summary>Um byte a cada 200 ms (bem abaixo do limite de tamanho).</summary>
    private sealed class DripStream : Stream
    {
        public int Served;
        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new NotSupportedException();
        public override long Position { get => Served; set => throw new NotSupportedException(); }
        public override int Read(byte[] b, int o, int c) => throw new NotSupportedException();
        public override async ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken ct = default)
        {
            if (Served >= 2000) return 0;
            await Task.Delay(200, ct);
            buffer.Span[0] = (byte)' ';
            Served++;
            return 1;
        }
        public override Task<int> ReadAsync(byte[] b, int o, int c, CancellationToken ct) => ReadAsync(b.AsMemory(o, c), ct).AsTask();
        public override void Flush() { }
        public override long Seek(long o, SeekOrigin s) => throw new NotSupportedException();
        public override void SetLength(long v) => throw new NotSupportedException();
        public override void Write(byte[] b, int o, int c) => throw new NotSupportedException();
    }

    private static async Task<ApiResult> Post(ApiClient api, CancellationToken ct = default)
    {
        var (uri, _) = api.Resolve("api/agent/v1/heartbeat");
        return await api.PostAsync(uri, "{}"u8.ToArray(), new Dictionary<string, string>(), ct);
    }

    // ------------------------------------------------------------------ 4.A prazo de leitura do corpo
    [Test]
    public static async Task R4A1_cabecalhos_imediatos_corpo_nunca_chega_gera_TIMEOUT_no_prazo()
    {
        using var api = new ApiClient(Loopback(), "t", new FixedHandler(() => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StreamContent(new NeverStream()) }), TimeSpan.FromMilliseconds(600));
        var sw = Stopwatch.StartNew();
        var r = await Post(api);
        Assert.Equal("TIMEOUT", r.TransportError);
        Assert.False(r.IsSuccess, "200 sem corpo no prazo não é sucesso");
        Assert.True(r.IsTransient);
        Assert.True(sw.Elapsed < TimeSpan.FromSeconds(3), $"demorou {sw.Elapsed}");
    }

    [Test]
    public static async Task R4A2_corpo_gotejando_abaixo_do_limite_de_tamanho_gera_TIMEOUT()
    {
        var drip = new DripStream();
        using var api = new ApiClient(Loopback(), "t", new FixedHandler(() => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StreamContent(drip) }), TimeSpan.FromSeconds(1));
        var sw = Stopwatch.StartNew();
        var r = await Post(api);
        Assert.Equal("TIMEOUT", r.TransportError);
        Assert.True(drip.Served < 50, $"leu {drip.Served} bytes");
        Assert.True(sw.Elapsed < TimeSpan.FromSeconds(4), $"demorou {sw.Elapsed}");
    }

    [Test]
    public static async Task R4A3_cancelamento_do_servico_durante_a_leitura_propaga_e_nao_vira_TIMEOUT()
    {
        using var api = new ApiClient(Loopback(), "t", new FixedHandler(() => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StreamContent(new NeverStream()) }), TimeSpan.FromSeconds(30));
        using var service = new CancellationTokenSource(TimeSpan.FromMilliseconds(300));
        var threw = false;
        try { await Post(api, service.Token); }
        catch (OperationCanceledException) { threw = true; }
        Assert.True(threw, "parada do serviço deve propagar OperationCanceledException");
    }

    [Test]
    public static async Task R4A4_sucesso_normal_e_Retry_After_respeitado()
    {
        using var ok = new ApiClient(Loopback(), "t", new FixedHandler(() => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{\"message_id\":\"m\",\"accepted\":true,\"duplicate\":false}") }), TimeSpan.FromSeconds(2));
        var r = await Post(ok);
        Assert.True(r.IsSuccess && r.Parse<Ack>().Accepted);
        using var busy = new ApiClient(Loopback(), "t", new FixedHandler(() =>
        {
            var m = new HttpResponseMessage(HttpStatusCode.ServiceUnavailable) { Content = new StringContent("{\"code\":\"X\",\"message\":\"m\",\"retryable\":true}") };
            m.Headers.RetryAfter = new System.Net.Http.Headers.RetryConditionHeaderValue(TimeSpan.FromSeconds(7));
            return m;
        }), TimeSpan.FromSeconds(2));
        var b = await Post(busy);
        Assert.Equal(TimeSpan.FromSeconds(7), b.RetryAfter);
        Assert.True(b.IsTransient && !b.IsSuccess);
        Assert.Equal("X", b.Code);
    }

    // ------------------------------------------------------------------ 4.C erro de transporte com status 200
    [Test]
    public static async Task R4C1_status_200_com_corpo_acima_do_limite_nao_e_sucesso()
    {
        using var api = new ApiClient(Loopback(), "t", new FixedHandler(() => new HttpResponseMessage(HttpStatusCode.OK) { Content = new ByteArrayContent(new byte[ApiClient.MaxResponseBytes + 10]) }));
        var r = await Post(api);
        Assert.Equal(200, r.Status);
        Assert.Equal("RESPONSE_TOO_LARGE", r.TransportError);
        Assert.False(r.IsSuccess);
        Assert.Equal("RESPONSE_TOO_LARGE", r.Code);
    }

    private static (string Dir, string KeyName) LinkedAgentDir()
    {
        var dir = TempDir();
        var inst = Guid.NewGuid().ToString("D");
        var keyName = $"SEMED-Agent-{inst}";
        new InsecureFileKeyStore(Path.Combine(dir, "k"), true).Create(keyName).Dispose();
        var st = new AgentState
        {
            InstallationId = inst, KeyName = keyName, DeviceId = Guid.NewGuid().ToString("D"), EnrollmentId = Guid.NewGuid().ToString("D"),
            Phase = Phase.Linked, Link = new LinkInfo { LinkId = Guid.NewGuid().ToString("D"), EquipmentId = "0e1f6a3c-0001-4001-8001-000000000001" },
            LinkConfirmedToServer = true,
        };
        st.Save(Path.Combine(dir, "state.json"));
        return (dir, keyName);
    }

    private static async Task<(DurableQueue Queue, FixedHandler Handler, AgentState State)> RunLinkedEngine(Func<HttpResponseMessage> response)
    {
        var (dir, _) = LinkedAgentDir();
        var handler = new FixedHandler(response);
        using (var engine = new AgentEngine(new EngineOptions
        {
            DataDirectory = dir, Config = Loopback(), KeyStore = new InsecureFileKeyStore(Path.Combine(dir, "k"), true),
            Inventory = new SimulatedInventorySource(null), Log = new FileLog(Path.Combine(dir, "log.txt")), HttpHandler = handler,
        }))
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
            try { await engine.RunAsync(cts.Token); } catch (OperationCanceledException) { }
        }
        return (new DurableQueue(Path.Combine(dir, "queue")), handler, AgentState.LoadOrCreate(Path.Combine(dir, "state.json"), SystemClock.Instance));
    }

    [Test]
    public static async Task R4C2_engine_mantem_item_na_fila_quando_200_vem_com_corpo_grande()
    {
        var (q, handler, state) = await RunLinkedEngine(() => new HttpResponseMessage(HttpStatusCode.OK) { Content = new ByteArrayContent(new byte[ApiClient.MaxResponseBytes + 10]) });
        var items = q.Pending();
        Assert.True(items.Count >= 1, "mensagens preservadas");
        Assert.True(items.Any(i => i.Attempts >= 1 && i.LastErrorCode == "RESPONSE_TOO_LARGE"), "tentativa registrada com o erro correto");
        Assert.Equal(0L, q.Stats.Rejected + q.Stats.Conflicts, "nada em quarentena");
        Assert.Equal(null, state.LastAckedInventoryId, "nada foi tratado como ACK");
        Assert.True(handler.Calls <= 3, $"sem tempestade de tentativas: {handler.Calls}");
    }

    [Test]
    public static async Task R4C3_engine_mantem_item_quando_200_traz_pagina_de_proxy_em_vez_de_ACK()
    {
        var (q, handler, state) = await RunLinkedEngine(() => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("<html>proxy institucional</html>") });
        var items = q.Pending();
        Assert.True(items.Count >= 1);
        Assert.True(items.Any(i => i.LastErrorCode == "ACK_INVALID"), "classificado como ACK inválido, não descartado");
        Assert.Equal(0L, q.Stats.Rejected + q.Stats.Conflicts);
        Assert.Equal(null, state.LastAckedInventoryId);
        Assert.True(handler.Calls <= 3, $"chamadas: {handler.Calls}");
    }

    // ------------------------------------------------------------------ 4.B durabilidade das lacunas
    private static void Inv(DurableQueue q, string id, string reason, string hash, DateTimeOffset t, IReadOnlyList<string>? gaps = null) =>
        q.Enqueue(MessageKind.Inventory, "p", id, "{\"id\":\"" + id + "\"}", t, new InventoryMeta(reason, hash, Iso.Format(t)), gaps);

    /// <summary>Fila com MaxInventories=3 e uma lacuna pendente (um periódico redundante descartado).</summary>
    private static (string Dir, DurableQueue Q, DateTimeOffset T) WithPendingGap()
    {
        var dir = TempDir();
        var q = new DurableQueue(dir) { MaxInventories = 3 };
        var t = DateTimeOffset.Parse("2026-11-01T00:00:00Z");
        Inv(q, "m1", "startup", "A", t);
        Inv(q, "m2", "periodic", "A", t.AddHours(6));
        Inv(q, "m3", "change_confirmed", "B", t.AddHours(12));
        Inv(q, "m4", "periodic", "B", t.AddHours(18)); // força descarte de m2 (redundante)
        Assert.Equal(1, q.GapsForAttach().Count);
        return (dir, q, t);
    }

    [Test]
    public static void R4B1_queda_apos_ler_lacuna_e_antes_de_gravar_mensagem_nao_perde_a_lacuna()
    {
        var (dir, q, _) = WithPendingGap();
        var gapId = q.GapsForAttach().Single().GapId;
        // "queda": a mensagem que levaria a lacuna nunca é gravada; o processo reinicia.
        var reopened = new DurableQueue(dir) { MaxInventories = 3 };
        var again = reopened.GapsForAttach();
        Assert.Equal(1, again.Count);
        Assert.Equal(gapId, again[0].GapId, "mesma lacuna, mesmo gap_id");
    }

    [Test]
    public static void R4B2_queda_durante_gravacao_e_reinicio_recupera_de_forma_deterministica()
    {
        var (dir, q, t) = WithPendingGap();
        var gapId = q.GapsForAttach().Single().GapId;
        // (a) escrita interrompida antes do rename: só temporário órfão.
        File.WriteAllText(Path.Combine(dir, ".tmp-interrompido"), "{parcial");
        var r1 = new DurableQueue(dir) { MaxInventories = 3 };
        Assert.False(File.Exists(Path.Combine(dir, ".tmp-interrompido")));
        Assert.Equal(gapId, r1.GapsForAttach().Single().GapId, "lacuna continua pendente");
        // (b) mensagem gravada, queda antes de atualizar o livro.
        r1.SimulateCrashAfterItemWrite = true;
        Assert.Throws<IOException>(() => Inv(r1, "m5", "periodic", "C", t.AddDays(1), [gapId]));
        var r2 = new DurableQueue(dir) { MaxInventories = 3 };
        Assert.Equal(0, r2.GapsForAttach().Count, "recuperação associa a lacuna à mensagem já gravada");
        Assert.Equal("m5", r2.GapLedger().Single(g => g.GapId == gapId).CarrierMessageId);
        Assert.True(r2.Pending().Single(i => i.MessageId == "m5").GapIds.Contains(gapId));
    }

    [Test]
    public static void R4B3_compactar_mensagem_portadora_antes_do_envio_reanexa_a_lacuna_original()
    {
        var (dir, q, t) = WithPendingGap();
        var original = q.GapsForAttach().Single().GapId;
        Inv(q, "carrier", "periodic", "B", t.AddDays(1), [original]); // portadora (redundante com m4) — será compactada
        Inv(q, "m6", "change_confirmed", "C", t.AddDays(2));           // força descarte da portadora
        var ids = q.Pending().Select(i => i.MessageId).ToList();
        Assert.False(ids.Contains("carrier"), "portadora compactada: " + string.Join(",", ids));
        var pending = q.GapsForAttach();
        Assert.True(pending.Any(g => g.GapId == original), "lacuna original voltou a pendente com o MESMO gap_id");
        Assert.True(pending.Any(g => g.GapId != original), "o novo descarte gerou outra lacuna (sem mesclar na já enviada)");
        Assert.Equal(1, pending.Single(g => g.GapId == original).DroppedCount, "conteúdo da lacuna enviada não muda");
    }

    [Test]
    public static void R4B4_envio_com_ACK_perdido_reenvia_mesmos_bytes_e_ACK_remove_do_livro()
    {
        var (dir, q, t) = WithPendingGap();
        var gapId = q.GapsForAttach().Single().GapId;
        q.Enqueue(MessageKind.Inventory, "p", "carrier", "{\"bytes\":\"exatos — ç\"}", t.AddDays(1), new InventoryMeta("change_confirmed", "C", Iso.Format(t.AddDays(1))), [gapId]);
        var item = q.Pending().Single(i => i.MessageId == "carrier");
        q.RecordAttempt(item, "TIMEOUT"); // ACK perdido
        var retry = new DurableQueue(dir) { MaxInventories = 3 }.Pending().Single(i => i.MessageId == "carrier");
        Assert.Equal("{\"bytes\":\"exatos — ç\"}", retry.Body);
        Assert.Equal(gapId, retry.GapIds.Single());
        Assert.False(q.GapsForAttach().Any(g => g.GapId == gapId), "não é reanexada a outra mensagem enquanto aguarda ACK");
        Assert.True(q.GapLedger().Any(g => g.GapId == gapId), "continua no livro até o ACK");
        q.Acknowledge(retry, "carrier");
        Assert.False(q.GapLedger().Any(g => g.GapId == gapId), "entregue somente após ACK");
    }

    [Test]
    public static void R4B5_quarentena_ou_corrupcao_da_portadora_devolve_a_lacuna()
    {
        var (dir, q, t) = WithPendingGap();
        var gapId = q.GapsForAttach().Single().GapId;
        Inv(q, "carrier", "change_confirmed", "C", t.AddDays(1), [gapId]);
        q.Quarantine(q.Pending().Single(i => i.MessageId == "carrier"), conflict: false, "VALIDATION_FAILED");
        Assert.True(q.GapsForAttach().Any(g => g.GapId == gapId), "quarentena devolve");
        // Rotação da quarentena não afeta o livro.
        var q2 = new DurableQueue(dir) { MaxInventories = 3, MaxQuarantineFiles = 0 };
        Inv(q2, "carrier2", "change_confirmed", "D", t.AddDays(2), [gapId]);
        q2.Quarantine(q2.Pending().Single(i => i.MessageId == "carrier2"), conflict: true, "X");
        Assert.True(q2.GapsForAttach().Any(g => g.GapId == gapId), "rotação da quarentena não apaga a lacuna");
        // Portadora corrompida no disco.
        Inv(q2, "carrier3", "change_confirmed", "E", t.AddDays(3), [gapId]);
        var f = Directory.EnumerateFiles(dir, "*carrier3.msg.json").Single();
        File.WriteAllText(f, "{corrompido");
        Assert.True(new DurableQueue(dir) { MaxInventories = 3 }.GapsForAttach().Any(g => g.GapId == gapId), "corrupção devolve");
    }

    // ------------------------------------------------------------------ revisão 0.1.2: migração do livro
    private const string LegacyStats = "{\"dropped_inventories\":2,\"pending_gap\":{\"dropped_count\":2,\"dropped_change_count\":1,\"first_dropped_collected_at\":\"2026-11-01T00:00:00Z\",\"last_dropped_collected_at\":\"2026-11-02T00:00:00Z\"}}";

    [Test]
    public static void R012_1_migracao_legada_gap_id_estavel_em_leituras_sucessivas()
    {
        var dir = TempDir();
        File.WriteAllText(Path.Combine(dir, "stats.json"), LegacyStats);
        var q = new DurableQueue(dir);
        var a = q.GapsForAttach().Single().GapId;
        var b = q.GapsForAttach().Single().GapId;
        var c = q.GapLedger().Single().GapId;
        Assert.Equal(a, b, "duas leituras");
        Assert.Equal(a, c, "livro = payload");
        Assert.False(File.ReadAllText(Path.Combine(dir, "stats.json")).Contains("pending_gap\":{"), "migração gravada na abertura");
    }

    [Test]
    public static void R012_2_reabrir_antes_de_enfileirar_mantem_o_id()
    {
        var dir = TempDir();
        File.WriteAllText(Path.Combine(dir, "stats.json"), LegacyStats);
        var id = new DurableQueue(dir).GapsForAttach().Single().GapId;
        Assert.Equal(id, new DurableQueue(dir).GapsForAttach().Single().GapId);
        Assert.Equal(id, new DurableQueue(dir).GapLedger().Single().GapId);
    }

    [Test]
    public static void R012_3_id_deterministico_mesmo_se_a_gravacao_da_migracao_nao_ocorrer()
    {
        var dir = TempDir();
        var q = new DurableQueue(dir);                          // aberta ANTES do arquivo legado existir
        File.WriteAllText(Path.Combine(dir, "stats.json"), LegacyStats); // migração não foi gravada por esta instância
        var a = q.GapsForAttach().Single().GapId;
        var b = q.GapsForAttach().Single().GapId;
        Assert.Equal(a, b, "conversão em memória não sorteia ids");
        Assert.True(System.Text.RegularExpressions.Regex.IsMatch(a, "^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"), a);
    }

    [Test]
    public static void R012_4_enqueue_associa_lacuna_legada_a_mensagem_certa_e_payload_tem_o_mesmo_id()
    {
        var dir = TempDir();
        File.WriteAllText(Path.Combine(dir, "stats.json"), LegacyStats);
        var q = new DurableQueue(dir);
        var gaps = q.GapsForAttach();
        var body = Encoding.UTF8.GetString(AgentJson.SerializeToUtf8(new InventoryMessage { MessageId = "carrier", QueueGaps = gaps }));
        q.Enqueue(MessageKind.Inventory, "p", "carrier", body, DateTimeOffset.UtcNow, new InventoryMeta("after_link", "A", "2026-11-03T00:00:00Z"), gaps.Select(g => g.GapId).ToList());
        var rec = new DurableQueue(dir).GapLedger().Single();
        Assert.Equal(gaps[0].GapId, rec.GapId);
        Assert.Equal("carrier", rec.CarrierMessageId);
        Assert.True(body.Contains(rec.GapId), "o id no corpo é o mesmo do livro");
        Assert.Equal(0, new DurableQueue(dir).GapsForAttach().Count, "não fica pendente para outra mensagem");
    }

    [Test]
    public static void R012_5_apos_ACK_reabrir_nao_recria_a_lacuna_legada()
    {
        var dir = TempDir();
        File.WriteAllText(Path.Combine(dir, "stats.json"), LegacyStats);
        var q = new DurableQueue(dir);
        var gaps = q.GapsForAttach();
        q.Enqueue(MessageKind.Inventory, "p", "carrier", "{}", DateTimeOffset.UtcNow, new InventoryMeta("after_link", "A", "2026-11-03T00:00:00Z"), gaps.Select(g => g.GapId).ToList());
        q.Acknowledge(q.Pending().Single(), "carrier");
        for (var i = 0; i < 3; i++)
        {
            var reopened = new DurableQueue(dir);
            Assert.Equal(0, reopened.GapLedger().Count, $"reabertura {i}");
            Assert.Equal(0, reopened.GapsForAttach().Count);
        }
    }

    [Test]
    public static void R4B6_estado_0_1_1_com_PendingGap_migra_para_o_livro()
    {
        var dir = TempDir();
        File.WriteAllText(Path.Combine(dir, "stats.json"), "{\"dropped_inventories\":2,\"pending_gap\":{\"dropped_count\":2,\"dropped_change_count\":1,\"first_dropped_collected_at\":\"2026-11-01T00:00:00Z\",\"last_dropped_collected_at\":\"2026-11-02T00:00:00Z\"}}");
        var q = new DurableQueue(dir);
        var g = q.GapsForAttach().Single();
        Assert.True(Guid.TryParse(g.GapId, out _));
        Assert.Equal(1, g.DroppedChangeCount);
    }
}
