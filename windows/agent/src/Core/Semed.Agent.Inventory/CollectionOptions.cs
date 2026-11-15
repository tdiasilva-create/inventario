using System;

namespace Semed.Agent.Inventory;

public sealed record CollectionOptions(bool CollectNetworkAddresses, bool CollectDomainName, TimeSpan PerSourceTimeout)
{
	public static readonly CollectionOptions Default = new CollectionOptions(CollectNetworkAddresses: false, CollectDomainName: false, TimeSpan.FromSeconds(20L));
}
