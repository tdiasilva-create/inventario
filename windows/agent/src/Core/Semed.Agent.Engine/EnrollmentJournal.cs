namespace Semed.Agent.Engine;

public sealed class EnrollmentJournal
{
	public string? ChallengeId { get; set; }

	public string? Challenge { get; set; }

	public string? ChallengeExpiresAt { get; set; }

	public string? FirstSentAt { get; set; }

	public string? LastSentAt { get; set; }

	public int Attempts { get; set; }

	public bool OutcomeUnknown { get; set; }
}
