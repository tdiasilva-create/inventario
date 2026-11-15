using Semed.Agent.Engine;

namespace Semed.Agent.Ipc;

public sealed record PipePolicy(string RenewRequires, string GrantRequires)
{
	public static readonly PipePolicy Strict = new PipePolicy("administrators", "administrators");

	public static PipePolicy From(AgentConfig c)
	{
		return new PipePolicy(c.PipeRenewRequires, c.PipeGrantRequires);
	}

	public bool Allows(string requirement, PipeCaller caller)
	{
		if (requirement == "interactive")
		{
			return caller.Identified;
		}
		return caller.Identified && caller.IsAdministrator;
	}
}
