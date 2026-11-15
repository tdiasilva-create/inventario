using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Semed.Agent.Protocol;
using Semed.Agent.Util;

namespace Semed.Agent.Engine;

public sealed partial class AgentEngine
{
    // Journal under the existing protected ProgramData directory. Never re-execute a job marked running.
    private sealed class NetworkJournal { public string Id{get;set;}="";public string AttemptId{get;set;}="";public string Mode{get;set;}="";public string Phase{get;set;}="starting";public long StartedAt{get;set;} public NetworkResult? Result{get;set;} }
    private string NetworkJournalPath=>Path.Combine(_o.DataDirectory,"network-test.json");
    private void SaveNetwork(NetworkJournal j)=>AtomicFile.WriteAllBytes(NetworkJournalPath,AgentJson.SerializeToUtf8(j));
    private void ArchiveNetwork() { File.Move(NetworkJournalPath,NetworkJournalPath+".last",true); }
    private async Task HandleNetworkAsync(NetworkOffer? offer,CancellationToken ct)
    {
        try{
            NetworkJournal? j=null;
            if(File.Exists(NetworkJournalPath))j=AgentJson.Deserialize<NetworkJournal>(File.ReadAllBytes(NetworkJournalPath));
            if(j==null&&offer==null)return;
            if(j==null){if(!Guid.TryParse(offer!.Id,out _)||!new[]{"light","speed"}.Contains(offer.Mode)||offer.ExpiresAt<DateTimeOffset.UtcNow.ToUnixTimeMilliseconds())return;j=new(){Id=offer.Id,AttemptId=Guid.NewGuid().ToString("D"),Mode=offer.Mode};SaveNetwork(j);}
            object Body(NetworkResult? result=null)=>new{protocol_version="1.0",installation_id=_state.InstallationId,id=j.Id,attempt_id=j.AttemptId,result};
            if(j.Phase=="starting"){
                var start=await PostDeviceAsync("network-tests/start",Body(),ct);
                if(!start.IsSuccess){if(start.Status is 403 or 404 or 409){ArchiveNetwork();}return;}
                using var doc=JsonDocument.Parse(start.Body);var job=doc.RootElement.GetProperty("job");
                if(job.GetProperty("target").GetString()!="cloudflare"||job.GetProperty("mode").GetString()!=j.Mode||job.GetProperty("id").GetString()!=j.Id)throw new InvalidDataException("Unsupported test policy");
                long stopAt=job.GetProperty("stop_at").GetInt64(),now=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                if(stopAt<=now||stopAt>now+65000){ArchiveNetwork();return;}
                j.Phase="running";j.StartedAt=now;SaveNetwork(j);
                using var lease=CancellationTokenSource.CreateLinkedTokenSource(ct);lease.CancelAfter(TimeSpan.FromMilliseconds(stopAt-now));
                using var measure=new NetworkMeasurement();
                async Task<bool> Continue(CancellationToken token){var check=await PostDeviceAsync("network-tests/check",Body(),token);if(!check.IsSuccess)return false;using var d=JsonDocument.Parse(check.Body);return d.RootElement.GetProperty("continue").GetBoolean();}
                j.Result=await measure.RunAsync(j.Mode,Continue,lease.Token);j.Phase="result";SaveNetwork(j);
            }else if(j.Phase=="running"){
                long stamp=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();j.Result=new("failed",j.StartedAt,stamp,null,null,null,null,"unknown","Serviço reiniciado durante a medição. O teste não foi repetido.");j.Phase="result";SaveNetwork(j);
            }
            if(j.Phase=="result"){
                var sent=await PostDeviceAsync("network-tests/result",Body(j.Result),ct);
                if(sent.IsSuccess||sent.Status is 403 or 404 or 409){ArchiveNetwork();}
            }
        }catch(OperationCanceledException){}catch(Exception e){_log.Warn("network_test_failure "+e.GetType().Name);}
    }
}
