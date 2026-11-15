namespace Semed.Agent.Ipc;

public sealed class PipeRequest
{
	public string Type { get; set; } = "status";

	public string? GrantCode { get; set; }
}
