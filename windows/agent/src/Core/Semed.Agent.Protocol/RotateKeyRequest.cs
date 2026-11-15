namespace Semed.Agent.Protocol;

public sealed class RotateKeyRequest
{
	public string ProtocolVersion { get; set; } = "1.0";

	public string RequestId { get; set; } = "";

	public string InstallationId { get; set; } = "";

	public JwkDto NewPublicKeyJwk { get; set; } = new JwkDto();

	public string NewKeyId { get; set; } = "";

	public RotateProof Proof { get; set; } = new RotateProof();
}
