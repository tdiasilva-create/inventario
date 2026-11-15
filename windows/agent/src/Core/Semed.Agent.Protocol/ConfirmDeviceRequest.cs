namespace Semed.Agent.Protocol;

public sealed class ConfirmDeviceRequest
{
	public string ProtocolVersion { get; set; } = "1.0";

	public string RequestId { get; set; } = "";

	public string InstallationId { get; set; } = "";

	public string LinkId { get; set; } = "";
}
