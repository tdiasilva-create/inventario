using System.Collections.Generic;

namespace Semed.Agent.Queue;

public sealed class QueueStats
{
	public long DroppedInventories { get; set; }

	public long DroppedChangeInventories { get; set; }

	public long CompactedHeartbeats { get; set; }

	public long Rejected { get; set; }

	public long Conflicts { get; set; }

	public long Corrupt { get; set; }

	public long QuarantineRotated { get; set; }

	public List<GapRecord> Gaps { get; set; } = new List<GapRecord>();

	public LegacyGap? PendingGap { get; set; }
}
