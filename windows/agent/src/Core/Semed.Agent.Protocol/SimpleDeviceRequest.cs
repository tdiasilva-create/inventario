namespace Semed.Agent.Protocol;

public sealed class SimpleDeviceRequest
{
	public string ProtocolVersion { get; set; } = "1.0";

	public string RequestId { get; set; } = "";

	public string InstallationId { get; set; } = "";
}
