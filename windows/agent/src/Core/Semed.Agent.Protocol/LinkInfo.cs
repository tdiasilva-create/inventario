namespace Semed.Agent.Protocol;

public sealed class LinkInfo
{
	public string LinkId { get; set; } = "";

	public string EquipmentId { get; set; } = "";

	public string? UnitName { get; set; }

	public string? EnvironmentName { get; set; }

	public string? PositionLabel { get; set; }

	public string? LinkedAt { get; set; }

	public string? DeviceConfirmedAt { get; set; }
}
