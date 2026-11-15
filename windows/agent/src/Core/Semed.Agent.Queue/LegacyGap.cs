namespace Semed.Agent.Queue;

public sealed class LegacyGap
{
	public int DroppedCount { get; set; }

	public int DroppedChangeCount { get; set; }

	public string FirstDroppedCollectedAt { get; set; } = "";

	public string LastDroppedCollectedAt { get; set; } = "";
}
