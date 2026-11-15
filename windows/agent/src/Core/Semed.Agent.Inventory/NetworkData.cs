using System.Collections.Generic;

namespace Semed.Agent.Inventory;

public sealed class NetworkData
{
	public bool AddressesCollected { get; set; }

	public List<NetworkAdapterData> Adapters { get; set; } = new List<NetworkAdapterData>();
}
