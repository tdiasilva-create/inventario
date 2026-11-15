namespace Semed.Agent.Protocol;

public sealed class StatusResponse
{
	public string DeviceId { get; set; } = "";

	public string EnrollmentId { get; set; } = "";

	public string State { get; set; } = "";

	public string? ExpiresAt { get; set; }

	public LinkInfo? Link { get; set; }

	public string? ServerTime { get; set; }
}
