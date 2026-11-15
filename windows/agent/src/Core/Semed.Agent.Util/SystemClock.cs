using System;

namespace Semed.Agent.Util;

public sealed class SystemClock : IClock
{
	public static readonly SystemClock Instance = new SystemClock();

	public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
