namespace Semed.Agent.Inventory;

public sealed class BaseboardData
{
	public string? Manufacturer { get; set; }

	public string? Product { get; set; }

	public string? Version { get; set; }

	public Identifier Serial { get; set; } = Identifier.Unread;
}
