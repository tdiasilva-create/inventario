using System.Net;
using System.Reflection;
using System.Security.Cryptography;
using System.Text.Json;
using Semed.Agent.Crypto;
using Semed.Agent.Engine;
using Semed.Agent.Inventory;
using Semed.Agent.Protocol;
using Semed.Agent.Qr;
using Semed.Agent.Util;

// Consumes the REAL directory prepared by Recovery.ps1, but uses test keys and a local HTTP handler.
using var fixture=JsonDocument.Parse(File.ReadAllText(args.Single()));
string Value(string key)=>fixture.RootElement.GetProperty(key).GetString()!;
var dir=Value("data");var archive=Value("archive");var oldId=Value("old_id");var newId=Value("new_id");
var archiveHashes=Directory.GetFiles(archive,"*",SearchOption.AllDirectories).ToDictionary(x=>x,x=>Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(x))));
int checks=0;
void Check(bool condition,string message){if(!condition)throw new Exception(message);checks++;Console.WriteLine("PASS "+message);}
var state=AgentState.LoadOrCreate(Path.Combine(dir,"state.json"),SystemClock.Instance);
Check(state.InstallationId==newId && state.InstallationId!=oldId,"PowerShell state deserialized by actual Core with new installation ID");
Check(state.KeyName=="SEMED-Agent-"+newId && state.Link==null && state.DeviceId==null && state.Sequence==0,"fresh identity has no historical link/sequence");
var keys=new InsecureFileKeyStore(Path.Combine(Path.GetDirectoryName(dir)!,"test-keys-outside-data"),true);
using(var oldKey=keys.Create(Value("old_key"))){}
var oldKeyPath=Path.Combine(Path.GetDirectoryName(dir)!,"test-keys-outside-data",Value("old_key")+".dev-key.p8");
var oldKeyHash=SHA256.HashData(File.ReadAllBytes(oldKeyPath));
var handler=new EnrollmentHandler(newId);
EngineOptions Options()=>new(){DataDirectory=dir,Config=AgentConfig.Load(Path.Combine(dir,"config.json")),KeyStore=keys,Inventory=new SimulatedInventorySource(null),Log=new FileLog(Path.Combine(dir,"logs","test.log")),HttpHandler=handler};
void Initialize(AgentEngine engine)=>typeof(AgentEngine).GetMethod("Initialize",BindingFlags.Instance|BindingFlags.NonPublic)!.Invoke(engine,null);
using(var engine=new AgentEngine(Options())){
 Initialize(engine);
 Check(engine.GetStatus().PendingMessages==0,"new engine never loads old pending queue");
 await (Task)typeof(AgentEngine).GetMethod("ActivationTickAsync",BindingFlags.Instance|BindingFlags.NonPublic)!.Invoke(engine,new object[]{CancellationToken.None})!;
 var status=engine.GetStatus();
 Check(status.Phase=="pending_pairing" && status.QrPayload!=null,"actual enrollment code obtains a new QR with controlled server");
 Check(status.Link==null,"new QR awaits human assignment; no old school inherited");
 using var qr=JsonDocument.Parse(status.QrPayload!);
 Check(qr.RootElement.GetProperty("type").GetString()=="semed.agent.pairing","QR contract remains compatible with collector");
 Check(QrCode.EncodeText(status.QrPayload!,QrCode.Ecc.M).Size>=21,"new QR is encodable by original renderer");
 Check(handler.Calls==2 && handler.Signed && handler.NoGrant,"automatic challenge/enrollment signed, no grant or telemetry");
}
using(var engine=new AgentEngine(Options())){
 Initialize(engine);
 Check(engine.GetStatus().Phase=="pending_pairing" && engine.GetStatus().QrPayload!=null,"restart keeps enrollment and QR; no second identity");
}
Check(oldKeyHash.SequenceEqual(SHA256.HashData(File.ReadAllBytes(oldKeyPath))),"old test key retained unchanged; new service key uses a different name");
foreach(var entry in archiveHashes)Check(Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(entry.Key)))==entry.Value,"archive unchanged: "+Path.GetRelativePath(archive,entry.Key));
Console.WriteLine($"{checks} Core/recovery checks passed. Local HTTP fixture only; no actual enrollment or service operation.");

sealed class EnrollmentHandler(string expectedId):HttpMessageHandler{
 public int Calls;public bool Signed,NoGrant;
 protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,CancellationToken ct){
  Calls++;var path=request.RequestUri!.AbsolutePath;
  object result;
  if(path.EndsWith("/enrollment-challenge")){
   NoGrant=request.Headers.Authorization==null;
   result=new ChallengeResponse{ChallengeId=Guid.NewGuid().ToString(),Challenge="test-challenge",ExpiresAt=DateTimeOffset.UtcNow.AddMinutes(5).ToString("o"),ServerTime=DateTimeOffset.UtcNow.ToString("o")};
  }else if(path.EndsWith("/enrollments")){
   var bytes=await request.Content!.ReadAsByteArrayAsync(ct);using var body=JsonDocument.Parse(bytes);
   if(body.RootElement.GetProperty("installation_id").GetString()!=expectedId)throw new Exception("Old identity sent");
   var jwk=body.RootElement.GetProperty("public_key_jwk");
   var pub=new PublicJwk("EC","P-256",jwk.GetProperty("x").GetString()!,jwk.GetProperty("y").GetString()!);
   string Header(string name)=>request.Headers.GetValues(name).Single();
   Signed=RequestSigner.Verify(pub,RequestSigner.Canonical("POST",path,long.Parse(Header("X-SEMED-Timestamp")),Header("X-SEMED-Nonce"),bytes),Header("X-SEMED-Signature"));
   result=new EnrollmentResponse{DeviceId=Guid.NewGuid().ToString(),EnrollmentId=Guid.NewGuid().ToString(),State="pending_pairing",PairingCode=new string('a',43),VisualCode="ABC-XYZ",ExpiresAt=DateTimeOffset.UtcNow.AddMinutes(10).ToString("o"),ServerTime=DateTimeOffset.UtcNow.ToString("o")};
  }else throw new Exception("Unexpected request after recovery: "+path);
  return new(HttpStatusCode.Created){Content=new ByteArrayContent(AgentJson.SerializeToUtf8(result))};
 }
}
