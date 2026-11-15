namespace Semed.Agent.Queue;

public sealed class QueueGap
{
	public string GapId { get; set; } = "";

	public int DroppedCount { get; set; }

	public int DroppedChangeCount { get; set; }

	public string FirstDroppedCollectedAt { get; set; } = "";

	public string LastDroppedCollectedAt { get; set; } = "";
}
