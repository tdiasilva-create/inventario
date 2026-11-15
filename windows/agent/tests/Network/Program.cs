using System.Net;
using System.Reflection;
using System.Runtime.Loader;
using System.Text.Json;
using Semed.Agent.Engine;
using Semed.Agent.Protocol;

int checks=0;
void Check(bool condition,string text){if(!condition)throw new Exception(text);checks++;Console.WriteLine("PASS "+text);}
var handler=new FakeHandler();
using(var measurement=new NetworkMeasurement(handler)){
 var light=await measurement.RunAsync("light",_=>Task.FromResult(true),CancellationToken.None);
 Check(light.Outcome=="completed"&&light.LatencyMs!=null,"light latency");
 Check(light.Download==null&&light.Upload==null&&handler.Requests==5,"no bulk traffic in light mode");
 Check(light.InterfaceType=="unknown","does not infer actual route from first adapter");
 var cancelled=await measurement.RunAsync("speed",_=>Task.FromResult(false),CancellationToken.None);
 Check(cancelled.Outcome=="cancelled"&&handler.Requests==5,"cancel before first packet");
 var stop=new CancellationTokenSource();stop.Cancel();
 Check((await measurement.RunAsync("light",_=>Task.FromResult(true),stop.Token)).Outcome=="cancelled","shutdown cancels");
 handler.Fail=true;
 Check((await measurement.RunAsync("light",_=>Task.FromResult(true),CancellationToken.None)).Outcome=="failed","HTTP failure is not success");
 handler.Fail=false;handler.Truncated=true;
 var incomplete=await measurement.RunAsync("speed",_=>Task.FromResult(true),CancellationToken.None);
 Check(incomplete.Outcome=="failed"&&incomplete.Upload==null,"truncated transfer not complete");
 handler.Truncated=false;
 var speed=await measurement.RunAsync("speed",_=>Task.FromResult(true),CancellationToken.None);
 // The test itself remains allowed to decline if the workstation has unrelated network traffic.
 Check(speed.Outcome=="completed"||speed.Reason?.StartsWith("Tráfego ativo")==true,"bounded speed sample or explicit busy refusal");
 if(speed.Outcome=="completed")Check(speed.Download!.Bytes==33554432&&speed.Upload!.Bytes==8388608,"32/8 MiB payload caps");
 Check(handler.ForeignUrls==0,"only fixed HTTPS target");
}
using(var d=JsonDocument.Parse(AgentJson.SerializeToUtf8(new HeartbeatMessage()))){Check(d.RootElement.GetProperty("network_test_protocol").GetInt32()==1,"capability in signed heartbeat");}
Check(AgentJson.Deserialize<Ack>("{\"accepted\":true,\"message_id\":\"old\"}"u8)!.NetworkTest==null,"legacy ACK accepted");
Check(AgentJson.Deserialize<Ack>("{\"network_test\":{\"id\":\"test\",\"mode\":\"light\",\"expires_at\":1}}"u8)!.NetworkTest!.Id=="test","new ACK parsed");
if(args.Length>0){
 var context=new AssemblyLoadContext("old",true);var original=context.LoadFromAssemblyPath(Path.GetFullPath(args[0]));var current=typeof(AgentEngine).Assembly;
 string Member(MemberInfo m)=>m.MemberType+":"+m.ToString();
 foreach(var type in original.GetExportedTypes()){
  var updated=current.GetType(type.FullName!)??throw new Exception("Removed type "+type.FullName);
  var members=updated.GetMembers(BindingFlags.Public|BindingFlags.Instance|BindingFlags.Static|BindingFlags.DeclaredOnly).Select(Member).ToHashSet();
  foreach(var m in type.GetMembers(BindingFlags.Public|BindingFlags.Instance|BindingFlags.Static|BindingFlags.DeclaredOnly))if(!members.Contains(Member(m)))throw new Exception("Removed signature "+type.FullName+" "+Member(m));
 }
 Check(true,"all original 0.1.8 public signatures preserved");context.Unload();
}
Console.WriteLine($"{checks} network checks passed; fake HTTP only, no external speed test.");

sealed class FakeHandler:HttpMessageHandler{
 public int Requests,ForeignUrls;public bool Fail,Truncated;
 protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage r,CancellationToken ct){
  ct.ThrowIfCancellationRequested();Requests++;if(r.RequestUri!.Scheme!="https"||r.RequestUri.Host!="speed.cloudflare.com")ForeignUrls++;
  if(Fail)return new(HttpStatusCode.ServiceUnavailable);
  if(r.Method==HttpMethod.Post){if(r.Content!.Headers.ContentLength!=8388608)throw new Exception("unexpected upload bytes");await r.Content.CopyToAsync(Stream.Null,ct);return new(HttpStatusCode.OK){Content=new ByteArrayContent([])};}
  bool bulk=r.RequestUri.Query.Contains("bytes=33554432");return new(HttpStatusCode.OK){Content=new ByteArrayContent(new byte[bulk?(Truncated?32:33554432):0])};
 }
}
