using System;

namespace Semed.Agent.Protocol;

public sealed class AgentPolicy
{
	public int ConfigVersion { get; set; }

	public int HeartbeatIntervalSeconds { get; set; } = 300;

	public int HeartbeatJitterPercent { get; set; } = 20;

	public int InventoryIntervalSeconds { get; set; } = 21600;

	public int InventoryForceSendSeconds { get; set; } = 86400;

	public int ChangeConfirmationDelaySeconds { get; set; } = 90;

	public bool PerformanceEnabled { get; set; }

	public int PerformanceIntervalSeconds { get; set; } = 600;

	public bool CollectNamedAccounts { get; set; }

	public bool CollectNetworkAddresses { get; set; }

	public bool CollectDomainName { get; set; }

	public AgentPolicy Clamped()
	{
		return new AgentPolicy
		{
			ConfigVersion = Math.Max(0, ConfigVersion),
			HeartbeatIntervalSeconds = Math.Clamp(HeartbeatIntervalSeconds, 60, 3600),
			HeartbeatJitterPercent = Math.Clamp(HeartbeatJitterPercent, 0, 50),
			InventoryIntervalSeconds = Math.Clamp(InventoryIntervalSeconds, 900, 604800),
			InventoryForceSendSeconds = Math.Clamp(InventoryForceSendSeconds, 3600, 2592000),
			ChangeConfirmationDelaySeconds = Math.Clamp(ChangeConfirmationDelaySeconds, 30, 600),
			PerformanceEnabled = PerformanceEnabled,
			PerformanceIntervalSeconds = Math.Clamp(PerformanceIntervalSeconds, 300, 3600),
			CollectNamedAccounts = false,
			CollectNetworkAddresses = CollectNetworkAddresses,
			CollectDomainName = CollectDomainName
		};
	}
}
