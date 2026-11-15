namespace Semed.Agent.Inventory;

public static class SectionNames
{
	public const string System = "system";

	public const string Cpu = "cpu";

	public const string Memory = "memory";

	public const string Storage = "storage";

	public const string Gpu = "gpu";

	public const string Network = "network";

	public const string Os = "os";

	public const string Accounts = "accounts";

	public static readonly string[] All = new string[8] { "system", "cpu", "memory", "storage", "gpu", "network", "os", "accounts" };
}
