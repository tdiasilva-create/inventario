namespace Semed.Agent.Protocol;

public sealed class EnrollmentResponse
{
	public string DeviceId { get; set; } = "";

	public string EnrollmentId { get; set; } = "";

	public string State { get; set; } = "";

	public string? PairingCode { get; set; }

	public string? VisualCode { get; set; }

	public string? ExpiresAt { get; set; }

	public bool RenewRequired { get; set; }

	public int? PollAfterSeconds { get; set; }

	public string? ServerTime { get; set; }
}
