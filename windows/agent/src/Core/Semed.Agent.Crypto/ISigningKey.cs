using System;

namespace Semed.Agent.Crypto;

public interface ISigningKey : IDisposable
{
	string KeyId { get; }

	PublicJwk PublicJwk { get; }

	byte[] SignData(byte[] data);
}
