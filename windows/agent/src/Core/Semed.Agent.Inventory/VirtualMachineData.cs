using System.Collections.Generic;

namespace Semed.Agent.Inventory;

public sealed class VirtualMachineData
{
	public bool? IsVm { get; set; }

	public string? Confidence { get; set; }

	public List<string> Evidence { get; set; } = new List<string>();
}
