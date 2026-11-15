namespace Semed.Agent.Engine;

public static class ActivationState
{
	public const string NotConfigured = "not_configured";

	public const string NoGrant = "no_grant";

	public const string Activating = "activating";

	public const string WaitingServer = "waiting_server";

	public const string Refused = "refused";

	public const string UnknownResult = "unknown_result";

	public const string Accepted = "accepted";

	public const string Revoked = "revoked";

	public const string IdentityConflict = "identity_conflict";

	public const string Blocked = "blocked";
}
