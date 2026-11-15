namespace Semed.Agent.Protocol;

public sealed class EnrollmentRequest
{
	public string ProtocolVersion { get; set; } = "1.0";

	public string RequestId { get; set; } = "";

	public string InstallationId { get; set; } = "";

	public string ChallengeId { get; set; } = "";

	public string Challenge { get; set; } = "";

	public JwkDto PublicKeyJwk { get; set; } = new JwkDto();

	public string AgentVersion { get; set; } = "";

	public EnrollmentSummary Summary { get; set; } = new EnrollmentSummary();
}
