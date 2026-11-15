namespace Semed.Agent.Protocol;

public sealed class RotateProof
{
	public long Timestamp { get; set; }

	public string Nonce { get; set; } = "";

	public string Signature { get; set; } = "";
}
