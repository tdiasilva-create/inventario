using Semed.Agent.Engine;

namespace Semed.Agent.Ipc;

public sealed class PipeResponse
{
	public bool Ok { get; set; }

	public string? Code { get; set; }

	public string? Message { get; set; }

	public StatusSnapshot? Status { get; set; }
}
