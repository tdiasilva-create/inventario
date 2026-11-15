namespace Semed.Agent.Inventory;

public sealed class AccountsData
{
	public long? EnabledLocalCount { get; set; }

	public long? DisabledLocalCount { get; set; }

	public long? InteractiveSessionCount { get; set; }

	public long? ConsoleSessionCount { get; set; }

	public long? RemoteSessionCount { get; set; }

	public bool NamedAccountsCollected => false;
}
