namespace Semed.Agent.Protocol;

public sealed class ErrorEnvelope
{
	public string Code { get; set; } = "";

	public string Message { get; set; } = "";

	public bool Retryable { get; set; }

	public string? CorrelationId { get; set; }

	public string? ServerTime { get; set; }
}
