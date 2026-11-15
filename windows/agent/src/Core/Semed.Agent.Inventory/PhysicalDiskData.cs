namespace Semed.Agent.Inventory;

public sealed class PhysicalDiskData
{
	public string? Model { get; set; }

	public string? Manufacturer { get; set; }

	public Identifier Serial { get; set; } = Identifier.Unread;

	public long? SizeBytes { get; set; }

	public string? BusType { get; set; }

	public string? MediaType { get; set; }

	public string? Location { get; set; }

	public string? Firmware { get; set; }
}
