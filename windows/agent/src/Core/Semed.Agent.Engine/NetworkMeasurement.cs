using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.NetworkInformation;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;

namespace Semed.Agent.Engine;

public sealed record TransferSample(long Bytes, double Milliseconds, bool Limited);
public sealed record NetworkResult(string Outcome,long StartedAt,long FinishedAt,double? LatencyMs,double? JitterMs,TransferSample? Download,TransferSample? Upload,string InterfaceType,string? Reason);
public sealed class NetworkOffer { public string Id {get;set;}=""; public string Mode {get;set;}=""; public string LinkId {get;set;}=""; public long ExpiresAt {get;set;} }

// Fixed HTTPS destination only; no IP scan, shell, arbitrary URL or executable download.
public sealed class NetworkMeasurement : IDisposable
{
    private readonly HttpClient http;
    public const int DownloadLimit=32*1024*1024, UploadLimit=8*1024*1024;
    public NetworkMeasurement(HttpMessageHandler? handler=null)
    {
        http=new HttpClient(handler??new SocketsHttpHandler{AllowAutoRedirect=false,AutomaticDecompression=DecompressionMethods.None,MaxConnectionsPerServer=1,ConnectTimeout=TimeSpan.FromSeconds(5)});
        http.Timeout=Timeout.InfiniteTimeSpan;
        http.DefaultRequestHeaders.UserAgent.ParseAdd("SEMED-Network-Diagnostic/0.1.9");
    }
    private static Uri Target(int bytes)=>new("https://speed.cloudflare.com/__down?bytes="+bytes+"&semed="+Guid.NewGuid().ToString("N"));
    public async Task<NetworkResult> RunAsync(string mode,Func<CancellationToken,Task<bool>> mayContinue,CancellationToken cancellation)
    {
        if(mode!="light"&&mode!="speed")throw new ArgumentException("Unsupported measurement mode");
        long started=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();double? latency=null,jitter=null;TransferSample? down=null,up=null;
        // An active adapter is not necessarily the actual route (VPN, proxy, multiple NICs).
        // Do not claim cable/Wi-Fi without a route-aware observation.
        string kind="unknown";
        NetworkResult Done(string outcome,string? reason)=>new(outcome,started,DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),latency,jitter,down,up,kind,reason);
        using var stop=CancellationTokenSource.CreateLinkedTokenSource(cancellation);stop.CancelAfter(TimeSpan.FromSeconds(mode=="speed"?45:15));var ct=stop.Token;
        try
        {
            var nics=NetworkInterface.GetAllNetworkInterfaces().Where(n=>n.OperationalStatus==OperationalStatus.Up).ToArray();
            var samples=new double[5];
            for(int i=0;i<samples.Length;i++){
                if(!await mayContinue(ct))return Done("cancelled","Interrompido pelo servidor.");
                var clock=Stopwatch.StartNew();using var response=await http.GetAsync(Target(0),HttpCompletionOption.ResponseHeadersRead,ct);response.EnsureSuccessStatusCode();samples[i]=clock.Elapsed.TotalMilliseconds;
                await Task.Delay(150,ct);
            }
            latency=Math.Round(samples.Order().ElementAt(2),2);jitter=Math.Round(samples.Zip(samples.Skip(1),(a,b)=>Math.Abs(a-b)).Average(),2);
            if(mode=="light")return Done("completed",null);
            // Detect local competing traffic only. This is not proof that the whole school network is idle.
            if(nics.Length>0){long Bytes()=>nics.Sum(n=>{var s=n.GetIPStatistics();return s.BytesReceived+s.BytesSent;});long a=Bytes();await Task.Delay(1500,ct);if(Bytes()-a>786432)return Done("failed","Tráfego ativo neste computador; teste não realizado. Solicite em outro momento.");}
            if(!await mayContinue(ct))return Done("cancelled","Interrompido pelo servidor.");
            var downloadClock=Stopwatch.StartNew();
            using(var download=await http.GetAsync(Target(DownloadLimit),HttpCompletionOption.ResponseHeadersRead,ct)){
                download.EnsureSuccessStatusCode();using var stream=await download.Content.ReadAsStreamAsync(ct);byte[] buffer=new byte[65536];long bytes=0;int count;var clock=downloadClock;long checkedAt=0;
                while((count=await stream.ReadAsync(buffer.AsMemory(0,(int)Math.Min(buffer.Length,DownloadLimit-bytes)),ct))>0){bytes+=count;if(clock.ElapsedMilliseconds-checkedAt>=5000){checkedAt=clock.ElapsedMilliseconds;if(!await mayContinue(ct))return Done("cancelled","Interrompido pelo servidor.");}if(bytes>=DownloadLimit)break;}
                if(bytes!=DownloadLimit)throw new IOException("Download incompleto.");
                down=new(bytes,Math.Max(1,clock.Elapsed.TotalMilliseconds),true);
            }
            if(!await mayContinue(ct))return Done("cancelled","Interrompido pelo servidor.");
            byte[] payload=new byte[UploadLimit];RandomNumberGenerator.Fill(payload);using var content=new ByteArrayContent(payload);content.Headers.ContentType=new("application/octet-stream");
            using(var uploadStop=CancellationTokenSource.CreateLinkedTokenSource(ct)){
                using var request=new HttpRequestMessage(HttpMethod.Post,"https://speed.cloudflare.com/__up"){Content=content};
                var clock=Stopwatch.StartNew();Task<HttpResponseMessage> transfer=http.SendAsync(request,HttpCompletionOption.ResponseHeadersRead,uploadStop.Token);
                try{
                    while(!transfer.IsCompleted){var tick=Task.Delay(5000,ct);if(await Task.WhenAny(transfer,tick)==transfer)break;ct.ThrowIfCancellationRequested();if(!await mayContinue(ct))return Done("cancelled","Interrompido pelo servidor.");}
                    using var response=await transfer;response.EnsureSuccessStatusCode();up=new(UploadLimit,Math.Max(1,clock.Elapsed.TotalMilliseconds),true);
                }finally{uploadStop.Cancel();if(!transfer.IsCompletedSuccessfully){try{using var ignored=await transfer;}catch{}}}
            }
            return Done("completed","Amostra limitada a 32 MiB de download e 8 MiB de upload; não mede a capacidade máxima contratada.");
        }
        catch(OperationCanceledException){return Done(cancellation.IsCancellationRequested?"cancelled":"failed","Interrompido ou tempo máximo atingido; resultado incompleto.");}
        catch(Exception e) when(e is HttpRequestException||e is IOException||e is NetworkInformationException||e is System.Security.SecurityException){return Done("failed","Falha de conexão ou leitura da rede; nenhum resultado completo.");}
    }
    public void Dispose()=>http.Dispose();
}
