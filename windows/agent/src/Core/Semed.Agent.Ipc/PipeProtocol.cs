using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Semed.Agent.Protocol;

namespace Semed.Agent.Ipc;

public static class PipeProtocol
{
	public const string PipeName = "SemedInventoryAgent.v1";

	public const int MaxMessageBytes = 16384;

	public static async Task WriteMessageAsync(Stream s, object msg, CancellationToken ct)
	{
		byte[] array = JsonSerializer.SerializeToUtf8Bytes(msg, msg.GetType(), AgentJson.Options);
		if (array.Length > 16384)
		{
			throw new InvalidOperationException("Mensagem IPC grande demais");
		}
		await s.WriteAsync(array, ct).ConfigureAwait(continueOnCapturedContext: false);
		s.WriteByte(10);
		await s.FlushAsync(ct).ConfigureAwait(continueOnCapturedContext: false);
	}

	public static async Task<T?> ReadMessageAsync<T>(Stream s, CancellationToken ct)
	{
		MemoryStream buf = new MemoryStream();
		byte[] one = new byte[1];
		while (true)
		{
			if (await s.ReadAsync(one, ct).ConfigureAwait(continueOnCapturedContext: false) == 0)
			{
				return default;
			}
			if (one[0] == 10)
			{
				break;
			}
			buf.WriteByte(one[0]);
			if (buf.Length > 16384)
			{
				throw new InvalidDataException("Mensagem IPC grande demais");
			}
		}
		return JsonSerializer.Deserialize<T>(buf.ToArray(), AgentJson.Options);
	}
}
