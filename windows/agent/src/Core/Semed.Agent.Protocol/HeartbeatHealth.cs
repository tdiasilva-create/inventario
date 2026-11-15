namespace Semed.Agent.Protocol;

public sealed class HeartbeatHealth
{
	public string Inventory { get; set; } = "not_run";

	public int PendingMessages { get; set; }

	public long DroppedMessages { get; set; }

	public string? LastErrorCode { get; set; }
}
