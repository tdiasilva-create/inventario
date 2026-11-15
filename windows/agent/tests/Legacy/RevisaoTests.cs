using System.Net;
using System.Text;
using Semed.Agent.Crypto;
using Semed.Agent.Engine;
using Semed.Agent.Inventory;
using Semed.Agent.Ipc;
using Semed.Agent.Protocol;
using Semed.Agent.Queue;
using Semed.Agent.Util;

namespace Semed.Agent.Tests;

/// <summary>Regressões dos achados 4.x da revisão 0.1.0 (03/11/2026).</summary>
public static class RevisaoTests
{
    private static string TempDir() => Directory.CreateTempSubdirectory("semedrev").FullName;

    // ------------------------------------------------------------------ 4.2 WMI preso
    [Test]
    public static void R42_consultas_presas_nao_criam_threads_sem_limite()
    {
        var runner = new BoundedRunner(maxInFlight: 2, baseCooldown: TimeSpan.Zero);
        using var never = new ManualResetEventSlim(false);
        string Stuck() { never.Wait(); return "nunca"; }

        // 50 varreduras com 5 fontes permanentemente travadas.
        var statuses = new List<RunStatus>();
        for (var round = 0; round < 50; round++)
            for (var src = 0; src < 5; src++)
                statuses.Add(runner.Run($"fonte{src}", Stuck, TimeSpan.FromMilliseconds(5)).Status);

        Assert.True(runner.ThreadsCreated <= 2, $"threads criadas: {runner.ThreadsCreated}");
        Assert.True(runner.InFlight <= 2);
        Assert.True(statuses.Contains(RunStatus.SourceStuck) && statuses.Contains(RunStatus.Busy));
        never.Set(); // libera para não vazar no processo de teste
    }

    [Test]
    public static void R42_fonte_lenta_abre_disjuntor_e_se_recupera()
    {
        var clock = new FakeClock(DateTimeOffset.Parse("2026-11-03T18:00:00Z"));
        var runner = new BoundedRunner(maxInFlight: 3, baseCooldown: TimeSpan.FromMinutes(10), clock: clock);
        using var gate = new ManualResetEventSlim(false);
        Assert.Equal(RunStatus.Timeout, runner.Run("lenta", () => { gate.Wait(); return 1; }, TimeSpan.FromMilliseconds(5)).Status);
        Assert.Equal(RunStatus.SourceStuck, runner.Run("lenta", () => 2, TimeSpan.FromSeconds(1)).Status);
        gate.Set();
        SpinWait.SpinUntil(() => runner.InFlight == 0, 2000);
        Assert.Equal(RunStatus.CircuitOpen, runner.Run("lenta", () => 3, TimeSpan.FromSeconds(1)).Status);
        clock.Now += TimeSpan.FromMinutes(11);
        var ok = runner.Run("lenta", () => 4, TimeSpan.FromSeconds(1));
        Assert.Equal(RunStatus.Ok, ok.Status);
        Assert.Equal(4, ok.Value);
        Assert.Equal(RunStatus.Ok, runner.Run("outra", () => 5, TimeSpan.FromSeconds(1)).Status, "outras fontes não são afetadas");
    }

    // ------------------------------------------------------------------ 4.3 resposta HTTP grande
    private sealed class FixedHandler(Func<HttpResponseMessage> make) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) => Task.FromResult(make());
    }

    private sealed class EndlessStream : Stream
    {
        public long Served;
        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new NotSupportedException();
        public override long Position { get => Served; set => throw new NotSupportedException(); }
        public override int Read(byte[] buffer, int offset, int count) { Array.Fill(buffer, (byte)'x', offset, count); Served += count; return count; }
        public override void Flush() { }
        public override long Seek(long o, SeekOrigin s) => throw new NotSupportedException();
        public override void SetLength(long v) => throw new NotSupportedException();
        public override void Write(byte[] b, int o, int c) => throw new NotSupportedException();
    }

    private static AgentConfig Loopback() => new() { ApiBaseUrl = "http://127.0.0.1:9", AllowInsecureLoopback = true };

    [Test]
    public static async Task R43_corpo_chunked_sem_content_length_e_interrompido_no_limite()
    {
        var endless = new EndlessStream();
        using var api = new ApiClient(Loopback(), "t", new FixedHandler(() => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StreamContent(endless) }));
        var (uri, _) = api.Resolve("api/agent/v1/heartbeat");
        var r = await api.PostAsync(uri, "{}"u8.ToArray(), new Dictionary<string, string>(), default);
        Assert.Equal("RESPONSE_TOO_LARGE", r.TransportError);
        Assert.True(endless.Served <= ApiClient.MaxResponseBytes + 128 * 1024, $"leu {endless.Served} bytes");
    }

    [Test]
    public static async Task R43_content_length_excessivo_rejeitado_sem_ler_corpo()
    {
        var endless = new EndlessStream();
        using var api = new ApiClient(Loopback(), "t", new FixedHandler(() =>
        {
            var c = new StreamContent(endless);
            c.Headers.ContentLength = 50L * 1024 * 1024;
            return new HttpResponseMessage(HttpStatusCode.BadGateway) { Content = c };
        }));
        var (uri, _) = api.Resolve("api/agent/v1/heartbeat");
        var r = await api.PostAsync(uri, "{}"u8.ToArray(), new Dictionary<string, string>(), default);
        Assert.Equal("RESPONSE_TOO_LARGE", r.TransportError);
        Assert.Equal(0L, endless.Served);
    }

    [Test]
    public static async Task R43_resposta_normal_continua_funcionando()
    {
        using var api = new ApiClient(Loopback(), "t", new FixedHandler(() => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{\"message_id\":\"m\",\"accepted\":true,\"duplicate\":false}") }));
        var (uri, _) = api.Resolve("api/agent/v1/heartbeat");
        var r = await api.PostAsync(uri, "{}"u8.ToArray(), new Dictionary<string, string>(), default);
        Assert.Equal(200, r.Status);
        Assert.True(r.Parse<Ack>().Accepted);
    }

    // ------------------------------------------------------------------ 4.4 fila e histórico de peças
    private static void Inv(DurableQueue q, string id, string reason, string hash, DateTimeOffset t) =>
        q.Enqueue(MessageKind.Inventory, "p", id, "{}", t, new InventoryMeta(reason, hash, Iso.Format(t)));

    [Test]
    public static void R44_A_B_A_offline_com_fila_cheia_preserva_as_mudancas()
    {
        var q = new DurableQueue(TempDir()) { MaxInventories = 4 };
        var t = DateTimeOffset.Parse("2026-11-01T00:00:00Z");
        Inv(q, "1-startup-A", "startup", "A", t);
        Inv(q, "2-periodic-A", "periodic", "A", t.AddDays(1));   // redundante
        Inv(q, "3-change-B", "change_confirmed", "B", t.AddDays(2));
        Inv(q, "4-periodic-B", "periodic", "B", t.AddDays(3));   // redundante
        Inv(q, "5-change-A", "change_confirmed", "A", t.AddDays(4));
        Inv(q, "6-periodic-A", "periodic", "A", t.AddDays(5));   // redundante
        var ids = q.Pending().Select(i => i.MessageId).ToList();
        Assert.Equal(4, ids.Count);
        Assert.True(ids.Contains("3-change-B") && ids.Contains("5-change-A"), "transições A→B→A preservadas: " + string.Join(",", ids));
        Assert.Equal("1-startup-A", ids[0]);
        Assert.Equal(0L, q.Stats.DroppedChangeInventories, "nenhuma mudança perdida");
        var gaps = q.GapsForAttach();
        Assert.True(gaps is [{ DroppedCount: 2, DroppedChangeCount: 0 }], "lacuna explícita registrada mesmo sem perda de mudança");
    }

    [Test]
    public static void R44_perda_inevitavel_de_mudanca_fica_registrada_como_lacuna()
    {
        var q = new DurableQueue(TempDir()) { MaxInventories = 3 };
        var t = DateTimeOffset.Parse("2026-11-01T00:00:00Z");
        Inv(q, "a", "startup", "A", t);
        Inv(q, "b", "change_confirmed", "B", t.AddDays(1));
        Inv(q, "c", "change_confirmed", "C", t.AddDays(2));
        Inv(q, "d", "change_confirmed", "D", t.AddDays(3));
        Assert.Equal(1L, q.Stats.DroppedChangeInventories);
        var gap = q.GapsForAttach().Single();
        Assert.Equal(1, gap.DroppedChangeCount);
        Assert.Equal(Iso.Format(t.AddDays(1)), gap.FirstDroppedCollectedAt);
    }

    [Test]
    public static void R44_quarentena_tem_limite_total_entre_subpastas()
    {
        var q = new DurableQueue(TempDir()) { MaxQuarantineFiles = 5 };
        for (var i = 0; i < 12; i++)
        {
            q.Enqueue(MessageKind.Inventory, "p", $"x{i}", "{}", DateTimeOffset.UtcNow.AddSeconds(i));
            q.Quarantine(q.Pending().Single(), conflict: i % 2 == 0, "TESTE");
        }
        Assert.True(q.QuarantineUsage().Files <= 5, $"arquivos: {q.QuarantineUsage().Files}");
        Assert.Equal(7L, q.Stats.QuarantineRotated);
    }

    [Test]
    public static void R44_queue_gap_serializado_conforme_contrato()
    {
        var msg = new InventoryMessage { QueueGaps = [new QueueGap { GapId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", DroppedCount = 2, DroppedChangeCount = 1, FirstDroppedCollectedAt = "2026-11-01T00:00:00Z", LastDroppedCollectedAt = "2026-11-02T00:00:00Z" }] };
        var json = Encoding.UTF8.GetString(AgentJson.SerializeToUtf8(msg));
        Assert.True(json.Contains("\"queue_gaps\":[{\"gap_id\":\"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\",\"dropped_count\":2,\"dropped_change_count\":1,"), json);
        var none = Encoding.UTF8.GetString(AgentJson.SerializeToUtf8(new InventoryMessage()));
        Assert.False(none.Contains("queue_gap"), "omitido quando não há lacuna");
    }

    [Test]
    public static void R44_estado_v1_migra_para_enfileirado_vs_confirmado()
    {
        var dir = TempDir();
        var path = Path.Combine(dir, "state.json");
        File.WriteAllText(path, "{\"schema_version\":1,\"installation_id\":\"22222222-2222-4222-8222-222222222222\",\"key_name\":\"k\",\"phase\":\"linked\",\"last_sent_inventory_id\":\"44444444-4444-4444-8444-444444444444\",\"last_sent_content_hash\":\"abc\",\"last_sent_section_hashes\":{\"memory\":\"h\"}}");
        var s = AgentState.LoadOrCreate(path, SystemClock.Instance);
        Assert.Equal("44444444-4444-4444-8444-444444444444", s.LastEnqueuedInventoryId);
        Assert.Equal("h", s.LastEnqueuedSectionHashes["memory"]);
        Assert.Equal(null, s.LastAckedInventoryId, "enfileirado não é confirmado");
        Assert.Equal(2, AgentState.LoadOrCreate(path, SystemClock.Instance).SchemaVersion);
    }

    // ------------------------------------------------------------------ 4.5 autorização no pipe
    private static AgentEngine PendingEngine(out string dir)
    {
        dir = TempDir();
        var cfg = new AgentConfig { ApiBaseUrl = "http://127.0.0.1:9", AllowInsecureLoopback = true };
        return new AgentEngine(new EngineOptions
        {
            DataDirectory = dir, Config = cfg, KeyStore = new InsecureFileKeyStore(Path.Combine(dir, "k"), true),
            Inventory = new SimulatedInventorySource(null), Log = new FileLog(Path.Combine(dir, "log.txt")),
        });
    }

    [Test]
    public static void R45_usuario_comum_le_status_mas_nao_renova_nem_envia_autorizacao()
    {
        using var engine = PendingEngine(out _);
        var user = new PipeCaller(Identified: true, IsAdministrator: false);
        var policy = PipePolicy.Strict;
        Assert.True(PipeDispatcher.Handle(engine, new PipeRequest { Type = "status" }, user, policy).Ok);
        var renew = PipeDispatcher.Handle(engine, new PipeRequest { Type = "renew_pairing" }, user, policy);
        Assert.Equal("ADMIN_REQUIRED", renew.Code);
        var grant = PipeDispatcher.Handle(engine, new PipeRequest { Type = "submit_grant", GrantCode = Base64Url.RandomToken(24) }, user, policy);
        Assert.Equal("ADMIN_REQUIRED", grant.Code);
    }

    [Test]
    public static void R45_cliente_nao_identificado_e_negado_mesmo_com_politica_interactive()
    {
        using var engine = PendingEngine(out _);
        var open = new PipePolicy("interactive", "interactive");
        var r = PipeDispatcher.Handle(engine, new PipeRequest { Type = "renew_pairing" }, PipeCaller.Unknown, open);
        Assert.Equal("ADMIN_REQUIRED", r.Code);
        var ok = PipeDispatcher.Handle(engine, new PipeRequest { Type = "renew_pairing" }, new PipeCaller(true, false), open);
        Assert.True(ok.Ok, "política interactive permite usuário identificado");
    }

    [Test]
    public static void R45_campo_is_admin_enviado_pelo_cliente_e_ignorado()
    {
        var json = "{\"type\":\"submit_grant\",\"grant_code\":\"" + Base64Url.RandomToken(24) + "\",\"is_admin\":true}";
        var req = AgentJson.Deserialize<PipeRequest>(Encoding.UTF8.GetBytes(json));
        using var engine = PendingEngine(out _);
        var r = PipeDispatcher.Handle(engine, req, new PipeCaller(true, false), PipePolicy.Strict);
        Assert.Equal("ADMIN_REQUIRED", r.Code);
    }

    [Test]
    public static void R45_config_rejeita_valor_de_politica_desconhecido()
    {
        Assert.Throws<InvalidOperationException>(() => new AgentConfig { ApiBaseUrl = "https://x.invalid", PipeGrantRequires = "everyone" }.Validate());
    }

    // ------------------------------------------------------------------ 4.1 proteção local
    [Test]
    public static void R41_acl_aberta_para_usuarios_e_detectada_por_sid()
    {
        var aces = new[]
        {
            new AceInfo("S-1-5-18", true, unchecked((int)0x1F01FF)),        // SYSTEM: ok
            new AceInfo("S-1-5-32-544", true, unchecked((int)0x1F01FF)),    // Administradores: ok
            new AceInfo("S-1-5-80-123", true, 0x1301BF),                    // conta do serviço: ok
        };
        Assert.Equal(0, AclPolicy.Evaluate(AclPolicy.Target.DataDirectory, aces).Count);
        var usersRead = aces.Append(new AceInfo("S-1-5-32-545", true, 0x1200A9)).ToArray(); // Users: ReadAndExecute
        Assert.Equal(1, AclPolicy.Evaluate(AclPolicy.Target.DataDirectory, usersRead).Count, "leitura de dados por Usuários bloqueia");
        Assert.Equal(0, AclPolicy.Evaluate(AclPolicy.Target.Binaries, usersRead).Count, "leitura de binários é normal");
        var everyoneWrite = aces.Append(new AceInfo("S-1-1-0", true, 0x2)).ToArray();
        Assert.Equal(1, AclPolicy.Evaluate(AclPolicy.Target.Config, everyoneWrite).Count);
        var deny = aces.Append(new AceInfo("S-1-5-11", false, unchecked((int)0x1F01FF))).ToArray();
        Assert.Equal(0, AclPolicy.Evaluate(AclPolicy.Target.DataDirectory, deny).Count, "regra Deny não é problema");
    }

    [Test]
    public static async Task R41_agente_bloqueado_nao_cadastra_nem_usa_autorizacao()
    {
        var dir = TempDir();
        File.WriteAllText(Path.Combine(dir, "install-grant.txt"), Base64Url.RandomToken(24));
        var calls = 0;
        using var engine = new AgentEngine(new EngineOptions
        {
            DataDirectory = dir,
            Config = new AgentConfig { ApiBaseUrl = "http://127.0.0.1:9", AllowInsecureLoopback = true },
            KeyStore = new InsecureFileKeyStore(Path.Combine(dir, "k"), true),
            Inventory = new SimulatedInventorySource(null),
            Log = new FileLog(Path.Combine(dir, "log.txt")),
            HttpHandler = new FixedHandler(() => { Interlocked.Increment(ref calls); return new HttpResponseMessage(HttpStatusCode.ServiceUnavailable); }),
            SecurityCheck = () => ["DataDirectory: leitura permitida para Usuários (S-1-5-32-545)"],
        });
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(1.5));
        try { await engine.RunAsync(cts.Token); } catch (OperationCanceledException) { }
        var st = engine.GetStatus();
        Assert.Equal(Phase.SecurityBlocked, st.Phase);
        Assert.Equal("SECURITY_BLOCKED", st.LastErrorCode);
        Assert.Equal(0, calls, "nenhuma chamada de rede");
        Assert.False(Directory.Exists(Path.Combine(dir, "k")) && Directory.EnumerateFiles(Path.Combine(dir, "k")).Any(), "nenhuma chave criada");
        Assert.True(File.Exists(Path.Combine(dir, "install-grant.txt")), "autorização não consumida");
        Assert.True(engine.SubmitGrant(Base64Url.RandomToken(24)).Contains("bloqueado"));
    }

    // ------------------------------------------------------------------ 4.6 truncamento
    [Test]
    public static void R46_secao_truncada_serializa_flag_e_nao_gera_suspeita_de_remocao()
    {
        var s = new Section { Quality = Quality.Partial, Truncated = true, CollectedAt = "x", ErrorCode = "TRUNCATED", Data = new CpuData() };
        Assert.True(Encoding.UTF8.GetString(AgentJson.SerializeToUtf8(s)).Contains("\"truncated\":true"));
        Assert.False(Encoding.UTF8.GetString(AgentJson.SerializeToUtf8(new Section { Quality = Quality.Ok })).Contains("truncated"));
        var prevH = new Dictionary<string, string> { ["memory"] = "h1" };
        var changes = ContentHash.SuspectedHardwareChanges(prevH, new Dictionary<string, string> { ["memory"] = Quality.Ok },
            new Dictionary<string, string> { ["memory"] = "h2" }, new Dictionary<string, string> { ["memory"] = Quality.Partial });
        Assert.Equal(0, changes.Count, "lista parcial não é remoção");
    }

    private sealed class FakeClock(DateTimeOffset start) : IClock
    {
        public DateTimeOffset Now = start;
        public DateTimeOffset UtcNow => Now;
    }
}
