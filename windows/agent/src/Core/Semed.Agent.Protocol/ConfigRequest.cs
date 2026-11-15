namespace Semed.Agent.Protocol;

public sealed class ConfigRequest
{
	public string ProtocolVersion { get; set; } = "1.0";

	public string RequestId { get; set; } = "";

	public string InstallationId { get; set; } = "";

	public int CurrentConfigVersion { get; set; }
}
