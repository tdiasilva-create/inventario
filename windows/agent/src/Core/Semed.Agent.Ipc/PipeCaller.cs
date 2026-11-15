namespace Semed.Agent.Ipc;

public readonly record struct PipeCaller(bool Identified, bool IsAdministrator)
{
	public static readonly PipeCaller Unknown = new PipeCaller(Identified: false, IsAdministrator: false);

	public static readonly PipeCaller DevTrusted = new PipeCaller(Identified: true, IsAdministrator: true);
}
