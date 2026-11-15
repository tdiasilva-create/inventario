using System.Security.Cryptography;
using System.Text;

namespace Semed.Agent.Crypto;

public sealed record PublicJwk(string Kty, string Crv, string X, string Y)
{
	public static PublicJwk FromParameters(ECParameters p)
	{
		if (p.Q.X == null || p.Q.Y == null || p.Q.X.Length != 32 || p.Q.Y.Length != 32)
		{
			throw new CryptographicException("Chave pública P-256 inválida");
		}
		return new PublicJwk("EC", "P-256", Base64Url.Encode(p.Q.X), Base64Url.Encode(p.Q.Y));
	}

	public string Thumbprint()
	{
		string s = $"{{\"crv\":\"{Crv}\",\"kty\":\"{Kty}\",\"x\":\"{X}\",\"y\":\"{Y}\"}}";
		return Base64Url.Encode(SHA256.HashData(Encoding.UTF8.GetBytes(s)));
	}
}
