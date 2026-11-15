using System.Collections.Generic;

namespace Semed.Agent.Inventory;

public sealed class StorageData
{
	public List<PhysicalDiskData> PhysicalDisks { get; set; } = new List<PhysicalDiskData>();

	public List<VolumeData> Volumes { get; set; } = new List<VolumeData>();
}
