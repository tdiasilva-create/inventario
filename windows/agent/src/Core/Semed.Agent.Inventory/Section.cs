using System.Text.Json.Serialization;

namespace Semed.Agent.Inventory;

public sealed class Section
{
	public string Quality { get; set; } = "error";

	public string? Source { get; set; }

	public string CollectedAt { get; set; } = "";

	public long DurationMs { get; set; }

	public string? ErrorCode { get; set; }

	[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
	public bool Truncated { get; set; }

	public object? Data { get; set; }
}
