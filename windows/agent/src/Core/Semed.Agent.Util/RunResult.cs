namespace Semed.Agent.Util;

public readonly record struct RunResult<T>(RunStatus Status, T? Value);
