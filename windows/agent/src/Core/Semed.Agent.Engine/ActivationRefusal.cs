namespace Semed.Agent.Engine;

public sealed class ActivationRefusal
{
	public string Code { get; set; } = "";

	public int HttpStatus { get; set; }

	public string? CorrelationId { get; set; }

	public string At { get; set; } = "";
}
