namespace Semed.Agent.Protocol;

public sealed class ChallengeResponse
{
	public string ChallengeId { get; set; } = "";

	public string Challenge { get; set; } = "";

	public string ExpiresAt { get; set; } = "";

	public string ServerTime { get; set; } = "";
}
