using System.Collections.Generic;

namespace Semed.Agent.Inventory;

public sealed class CpuData
{
	public long? ProcessorCount { get; set; }

	public List<ProcessorData> Processors { get; set; } = new List<ProcessorData>();
}
