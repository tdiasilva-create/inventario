namespace Semed.Agent.Protocol;

public sealed class HeartbeatMessage
{
	public int NetworkTestProtocol { get; set; } = 1;
	public string ProtocolVersion { get; set; } = "1.0";

	public string MessageId { get; set; } = "";

	public string InstallationId { get; set; } = "";

	public string BootId { get; set; } = "";

	public long Sequence { get; set; }

	public string CollectedAt { get; set; } = "";

	public string AgentVersion { get; set; } = "";

	public long UptimeSeconds { get; set; }

	public string Reason { get; set; } = "periodic";

	public HeartbeatHealth Health { get; set; } = new HeartbeatHealth();

	public string? LatestInventoryId { get; set; }

	public PerformanceSample? Performance { get; set; }
}
