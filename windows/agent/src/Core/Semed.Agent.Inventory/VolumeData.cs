namespace Semed.Agent.Inventory;

public sealed class VolumeData
{
	public string? Mount { get; set; }

	public string? FileSystem { get; set; }

	public string? DriveType { get; set; }

	public long? SizeBytes { get; set; }

	public long? FreeBytes { get; set; }
}
