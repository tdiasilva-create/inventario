using System.Collections.Generic;

namespace Semed.Agent.Inventory;

public sealed class GpuData
{
	public List<GpuAdapterData> Adapters { get; set; } = new List<GpuAdapterData>();
}
