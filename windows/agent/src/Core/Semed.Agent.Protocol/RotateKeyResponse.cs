namespace Semed.Agent.Protocol;

public sealed class RotateKeyResponse
{
	public string NewKeyId { get; set; } = "";

	public string? OldKeyId { get; set; }

	public string? OldKeyValidUntil { get; set; }
}
