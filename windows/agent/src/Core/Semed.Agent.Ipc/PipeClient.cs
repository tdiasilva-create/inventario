using System;
using System.IO.Pipes;
using System.Security.Principal;
using System.Threading;
using System.Threading.Tasks;

namespace Semed.Agent.Ipc;

public static class PipeClient
{
	public static async Task<PipeResponse?> SendAsync(PipeRequest req, TimeSpan timeout)
	{
		using CancellationTokenSource cts = new CancellationTokenSource(timeout);
		PipeResponse result;
		await using (NamedPipeClientStream c = new NamedPipeClientStream(".", "SemedInventoryAgent.v1", PipeDirection.InOut, PipeOptions.Asynchronous, TokenImpersonationLevel.Identification))
		{
			await c.ConnectAsync(cts.Token).ConfigureAwait(continueOnCapturedContext: false);
			await PipeProtocol.WriteMessageAsync(c, req, cts.Token).ConfigureAwait(continueOnCapturedContext: false);
			result = await PipeProtocol.ReadMessageAsync<PipeResponse>(c, cts.Token).ConfigureAwait(continueOnCapturedContext: false);
		}
		return result;
	}
}
