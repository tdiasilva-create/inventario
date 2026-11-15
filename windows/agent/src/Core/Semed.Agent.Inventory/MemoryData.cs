using System.Collections.Generic;

namespace Semed.Agent.Inventory;

public sealed class MemoryData
{
	public long? InstalledBytes { get; set; }

	public long? VisibleBytes { get; set; }

	public long? SlotCount { get; set; }

	public string? SlotCountReliability { get; set; }

	public List<MemoryModuleData> Modules { get; set; } = new List<MemoryModuleData>();
}
