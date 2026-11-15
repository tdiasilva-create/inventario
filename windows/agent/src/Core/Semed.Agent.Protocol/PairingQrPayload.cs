namespace Semed.Agent.Protocol;

public sealed class PairingQrPayload
{
	public string Type { get; set; } = "semed.agent.pairing";

	public int Version { get; set; } = 1;

	public string EnrollmentId { get; set; } = "";

	public string PairingCode { get; set; } = "";

	public string ExpiresAt { get; set; } = "";
}
