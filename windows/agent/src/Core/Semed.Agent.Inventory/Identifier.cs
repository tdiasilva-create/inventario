namespace Semed.Agent.Inventory;

public sealed record Identifier(string? Value, string Reliability)
{
	public static readonly Identifier Unread = new Identifier(null, "unread");
}
