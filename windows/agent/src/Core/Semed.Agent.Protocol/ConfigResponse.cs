namespace Semed.Agent.Protocol;

public sealed class ConfigResponse
{
	public int ConfigVersion { get; set; }

	public AgentPolicy Policy { get; set; } = new AgentPolicy();

	public string? ServerTime { get; set; }
}
