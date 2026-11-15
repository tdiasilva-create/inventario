using System;
using System.Security.Cryptography;

namespace Semed.Agent.Crypto;

public class EcdsaSigningKey : ISigningKey, IDisposable
{
	private readonly ECDsa _ecdsa;

	public string KeyId { get; }

	public PublicJwk PublicJwk { get; }

	public EcdsaSigningKey(ECDsa ecdsa)
	{
		_ecdsa = ecdsa;
		if (ecdsa.KeySize != 256)
		{
			throw new CryptographicException("Chave deve ser P-256");
		}
		PublicJwk = Semed.Agent.Crypto.PublicJwk.FromParameters(ecdsa.ExportParameters(includePrivateParameters: false));
		KeyId = PublicJwk.Thumbprint();
	}

	public byte[] SignData(byte[] data)
	{
		return _ecdsa.SignData(data, HashAlgorithmName.SHA256, DSASignatureFormat.IeeeP1363FixedFieldConcatenation);
	}

	public void Dispose()
	{
		_ecdsa.Dispose();
	}
}
