using Semed.Agent.Protocol;

namespace Semed.Agent.Engine;

public sealed class StatusSnapshot
{
	public string Phase { get; set; } = "";

	public string PhaseLabel { get; set; } = "";

	public string AgentVersion { get; set; } = "";

	public bool Connected { get; set; }

	public string? ServerHost { get; set; }

	public EnrollmentSummary? Summary { get; set; }

	public string? QrPayload { get; set; }

	public string? VisualCode { get; set; }

	public string? PairingExpiresAt { get; set; }

	public bool PairingExpired { get; set; }

	public LinkInfo? Link { get; set; }

	public string? LastHeartbeatAckAt { get; set; }

	public string? LastInventoryAckAt { get; set; }

	public string? LastAckedInventoryId { get; set; }

	public long DroppedChangeMessages { get; set; }

	public int PendingMessages { get; set; }

	public long DroppedMessages { get; set; }

	public string? LastErrorCode { get; set; }

	public string? LastErrorMessage { get; set; }

	public string? ClockSkewNote { get; set; }

	public string? InventoryQualitySummary { get; set; }

	public string? KeyStore { get; set; }

	public string UpdatedAt { get; set; } = "";

	public bool ServerReachable { get; set; }

	public string? LastContactAt { get; set; }

	public string Activation { get; set; } = "";

	public string? GrantFile { get; set; }

	public int? LastHttpStatus { get; set; }

	public string? LastCorrelationId { get; set; }

	public string? LastAttemptAt { get; set; }

	public string? NextAttemptAt { get; set; }

	public string? LastErrorAt { get; set; }

	public string? ActionHint { get; set; }

	public string? CampaignLabel { get; set; }

	public bool EnrollOutcomeUnknown { get; set; }
}
