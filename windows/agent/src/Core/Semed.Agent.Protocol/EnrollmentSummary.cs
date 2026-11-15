namespace Semed.Agent.Protocol;

public sealed class EnrollmentSummary
{
	public string Hostname { get; set; } = "";

	public string? Manufacturer { get; set; }

	public string? Model { get; set; }

	public string? SerialHint { get; set; }

	public string? CpuName { get; set; }

	public long? LogicalProcessors { get; set; }

	public long? InstalledMemoryBytes { get; set; }

	public string? OsCaption { get; set; }

	public string? OsBuild { get; set; }
}
