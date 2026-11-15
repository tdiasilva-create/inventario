namespace Semed.Agent.Inventory;

public sealed class GpuAdapterData
{
	public string? Name { get; set; }

	public string? Manufacturer { get; set; }

	public string? PnpDeviceId { get; set; }

	public string? DriverVersion { get; set; }

	public string? DriverDate { get; set; }

	public long? ReportedMemoryBytes { get; set; }

	public string? ReportedMemoryReliability { get; set; }
}
