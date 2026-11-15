namespace Semed.Agent.Engine;

public sealed class PairingTicket
{
	public string EnrollmentId { get; set; } = "";

	public string PairingCode { get; set; } = "";

	public string VisualCode { get; set; } = "";

	public string ExpiresAt { get; set; } = "";
}
