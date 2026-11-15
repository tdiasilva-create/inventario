namespace Semed.Agent.Engine;

public static class Phase
{
	public const string NotConfigured = "not_configured";

	public const string AwaitingGrant = "awaiting_grant";

	public const string PendingPairing = "pending_pairing";

	public const string Linked = "linked";

	public const string Revoked = "revoked";

	public const string IdentityConflict = "identity_conflict";

	public const string SecurityBlocked = "security_blocked";
}
