using System.Net;
using System.Reflection;
using System.Text.Json;
using Semed.Agent.Engine;
using Semed.Agent.Crypto;
using Semed.Agent.Inventory;
using Semed.Agent.Protocol;
using Semed.Agent.Util;

namespace Semed.Agent.Tests;
public static class NetworkJournalTests
{
    private sealed class ResultHandler : HttpMessageHandler
    {
        public bool Accept; public int Requests;
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage r,CancellationToken ct)
        {
            Requests++;
            Assert.True(r.RequestUri!.AbsolutePath.EndsWith("/network-tests/result"),"Recovery must send result only, never start traffic again");
            Assert.True(r.Headers.Contains("X-SEMED-Signature"));
            using var j=JsonDocument.Parse(await r.Content!.ReadAsByteArrayAsync(ct));
            Assert.Equal("failed",j.RootElement.GetProperty("result").GetProperty("outcome").GetString());
            return new(Accept?HttpStatusCode.OK:HttpStatusCode.ServiceUnavailable){Content=new StringContent(Accept?"{\"accepted\":true}":"{}")};
        }
    }
    [Test]
    public static async Task Recovery_does_not_repeat_traffic_and_keeps_identity_and_result_until_ACK()
    {
        var dir=Directory.CreateTempSubdirectory("semed-network-journal-").FullName;
        var keys=new InsecureFileKeyStore(Path.Combine(dir,"keys"),true);
        var state=new AgentState{InstallationId=Guid.NewGuid().ToString(),DeviceId=Guid.NewGuid().ToString(),KeyName="test",Phase="linked"};
        using(var key=keys.Create("test")){}
        state.Save(Path.Combine(dir,"state.json"));
        var originalState=File.ReadAllBytes(Path.Combine(dir,"state.json"));
        var originalKey=File.ReadAllBytes(Path.Combine(dir,"keys","test.dev-key.p8"));
        var journal=Path.Combine(dir,"network-test.json");
        File.WriteAllBytes(journal,AgentJson.SerializeToUtf8(new{id=Guid.NewGuid().ToString(),attempt_id=Guid.NewGuid().ToString(),mode="speed",phase="running",started_at=DateTimeOffset.UtcNow.AddSeconds(-10).ToUnixTimeMilliseconds(),result=(object?)null}));
        var handler=new ResultHandler();
        using var engine=new AgentEngine(new EngineOptions{DataDirectory=dir,Config=new(){ApiBaseUrl="https://unit.test"},KeyStore=keys,Inventory=new SimulatedInventorySource(null),Log=new FileLog(Path.Combine(dir,"log")),HttpHandler=handler});
        typeof(AgentEngine).GetMethod("Initialize",BindingFlags.Instance|BindingFlags.NonPublic)!.Invoke(engine,null);
        async Task Recover()=>await (Task)typeof(AgentEngine).GetMethod("HandleNetworkAsync",BindingFlags.Instance|BindingFlags.NonPublic)!.Invoke(engine,new object?[]{null,CancellationToken.None})!;
        await Recover();Assert.Equal(1,handler.Requests);Assert.True(File.Exists(journal));
        var saved=File.ReadAllBytes(journal);Assert.True(JsonDocument.Parse(saved).RootElement.GetProperty("result").GetProperty("reason").GetString()!.Contains("não foi repetido"));
        handler.Accept=true;await Recover();Assert.Equal(2,handler.Requests);Assert.False(File.Exists(journal));Assert.True(File.Exists(journal+".last"));
        Assert.True(originalState.SequenceEqual(File.ReadAllBytes(Path.Combine(dir,"state.json"))));
        Assert.True(originalKey.SequenceEqual(File.ReadAllBytes(Path.Combine(dir,"keys","test.dev-key.p8"))));
    }
}
