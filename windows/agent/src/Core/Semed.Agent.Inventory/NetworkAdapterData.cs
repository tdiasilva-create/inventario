using System.Collections.Generic;

namespace Semed.Agent.Inventory;

public sealed class NetworkAdapterData
{
	public string? Name { get; set; }

	public string? Description { get; set; }

	public string? Kind { get; set; }

	public string? InterfaceType { get; set; }

	public string? Mac { get; set; }

	public string? Status { get; set; }

	public List<string> Ipv4 { get; set; } = new List<string>();

	public List<string> Ipv6 { get; set; } = new List<string>();

	public bool? DhcpEnabled { get; set; }

	public List<string> Gateways { get; set; } = new List<string>();

	public List<string> DnsServers { get; set; } = new List<string>();
}
