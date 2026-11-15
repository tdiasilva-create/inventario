using System.Collections.Generic;

namespace Semed.Agent.Inventory;

public sealed class SystemData
{
	public string? Hostname { get; set; }

	public string? DnsHostname { get; set; }

	public string? Manufacturer { get; set; }

	public string? Model { get; set; }

	public string? SystemFamily { get; set; }

	public string? Sku { get; set; }

	public List<int>? ChassisTypes { get; set; }

	public string? ChassisKind { get; set; }

	public Identifier Serial { get; set; } = Identifier.Unread;

	public Identifier SmbiosUuid { get; set; } = Identifier.Unread;

	public BaseboardData? Baseboard { get; set; }

	public BiosData? Bios { get; set; }

	public VirtualMachineData? VirtualMachine { get; set; }

	public string? Architecture { get; set; }
}
