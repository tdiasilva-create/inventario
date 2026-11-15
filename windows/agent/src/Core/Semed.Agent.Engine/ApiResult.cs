using System;
using System.IO;
using Semed.Agent.Protocol;

namespace Semed.Agent.Engine;

public sealed record ApiResult(int Status, byte[] Body, TimeSpan? RetryAfter, ErrorEnvelope? Error, DateTimeOffset? ServerDate, string? TransportError)
{
	public bool IsSuccess
	{
		get
		{
			if (TransportError == null)
			{
				int status = Status;
				if (status >= 200)
				{
					return status < 300;
				}
				return false;
			}
			return false;
		}
	}

	public string Code => TransportError ?? Error?.Code ?? $"HTTP_{Status}";

	public bool IsTransient
	{
		get
		{
			bool flag = TransportError != null;
			if (!flag)
			{
				int status = Status;
				bool flag2 = ((status == 0 || status == 408 || status == 429) ? true : false);
				flag = flag2;
			}
			if (!flag)
			{
				return Status >= 500;
			}
			return true;
		}
	}

	public T Parse<T>() where T : class
	{
		return AgentJson.Deserialize<T>(Body) ?? throw new InvalidDataException("Resposta vazia");
	}
}
