namespace Semed.Agent.Inventory;

public sealed class ProcessorData
{
	public string? Socket { get; set; }

	public string? Manufacturer { get; set; }

	public string? Name { get; set; }

	public string? Architecture { get; set; }

	public long? Cores { get; set; }

	public long? LogicalProcessors { get; set; }

	public long? MaxClockMhz { get; set; }

	public string? ProcessorId { get; set; }
}
