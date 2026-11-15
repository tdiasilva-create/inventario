namespace Semed.Agent.Protocol;

public sealed class ChallengeRequest
{
	public string ProtocolVersion { get; set; } = "1.0";

	public string RequestId { get; set; } = "";

	public string AgentVersion { get; set; } = "";
}
