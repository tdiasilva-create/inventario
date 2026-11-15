using System.Collections.Generic;
using System.Text.Json.Serialization;
using Semed.Agent.Inventory;
using Semed.Agent.Queue;

namespace Semed.Agent.Protocol;

public sealed class InventoryMessage
{
	public string ProtocolVersion { get; set; } = "1.0";

	public string MessageId { get; set; } = "";

	public string InventoryId { get; set; } = "";

	public string InstallationId { get; set; } = "";

	public string BootId { get; set; } = "";

	public long Sequence { get; set; }

	public string CollectedAt { get; set; } = "";

	public string? PreviousInventoryId { get; set; }

	public string AgentVersion { get; set; } = "";

	public string CollectorVersion { get; set; } = "";

	public string Reason { get; set; } = "periodic";

	public string ContentHash { get; set; } = "";

	[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
	public List<QueueGap>? QueueGaps { get; set; }

	public Dictionary<string, Section> Sections { get; set; } = new Dictionary<string, Section>();
}
