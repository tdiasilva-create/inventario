namespace Semed.Agent.Inventory;

public sealed class MemoryModuleData
{
	public string? Slot { get; set; }

	public string? Bank { get; set; }

	public long? CapacityBytes { get; set; }

	public string? Manufacturer { get; set; }

	public string? PartNumber { get; set; }

	public Identifier Serial { get; set; } = Identifier.Unread;

	public string? MemoryType { get; set; }

	public long? SpeedMhz { get; set; }

	public long? ConfiguredSpeedMhz { get; set; }
}
