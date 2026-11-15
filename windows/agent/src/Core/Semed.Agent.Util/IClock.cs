using System;

namespace Semed.Agent.Util;

public interface IClock
{
	DateTimeOffset UtcNow { get; }
}
