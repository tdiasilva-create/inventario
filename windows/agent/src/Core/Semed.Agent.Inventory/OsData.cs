namespace Semed.Agent.Inventory;

public sealed class OsData
{
	public string? Caption { get; set; }

	public string? Version { get; set; }

	public string? BuildNumber { get; set; }

	public string? Architecture { get; set; }

	public string? InstallDate { get; set; }

	public string? LastBootAt { get; set; }

	public bool? PartOfDomain { get; set; }

	public string? DomainName { get; set; }
}
