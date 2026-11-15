using System;

namespace Semed.Agent.Queue;

public sealed class GapRecord
{
	public string GapId { get; set; } = Guid.NewGuid().ToString("D");

	public int DroppedCount { get; set; }

	public int DroppedChangeCount { get; set; }

	public string FirstDroppedCollectedAt { get; set; } = "";

	public string LastDroppedCollectedAt { get; set; } = "";

	public bool EverAttached { get; set; }

	public string? CarrierMessageId { get; set; }

	public QueueGap ToWire()
	{
		return new QueueGap
		{
			GapId = GapId,
			DroppedCount = DroppedCount,
			DroppedChangeCount = DroppedChangeCount,
			FirstDroppedCollectedAt = FirstDroppedCollectedAt,
			LastDroppedCollectedAt = LastDroppedCollectedAt
		};
	}
}
