using System;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace Semed.Agent.Crypto;

public static class RequestSigner
{
	public static string Sha256Hex(ReadOnlySpan<byte> data)
	{
		return Convert.ToHexStringLower(SHA256.HashData(data));
	}

	public static string Canonical(string method, string path, long timestamp, string nonce, ReadOnlySpan<byte> body)
	{
		if (path.Contains('?'))
		{
			throw new ArgumentException("Caminho assinado não pode conter query string", "path");
		}
		if (nonce.Contains('\n') || path.Contains('\n'))
		{
			throw new ArgumentException("Quebra de linha não permitida");
		}
		_003C_003Ey__InlineArray5<string> buffer = default;
		buffer[0] = method.ToUpperInvariant();
		buffer[1] = path;
		buffer[2] = timestamp.ToString(CultureInfo.InvariantCulture);
		buffer[3] = nonce;
		buffer[4] = Sha256Hex(body);
		return string.Join('\n', (ReadOnlySpan<string?>)buffer);
	}

	public static SignedHeaders Sign(ISigningKey key, string method, string path, ReadOnlySpan<byte> body, long timestamp, string? nonce = null)
	{
		if (nonce == null)
		{
			nonce = Base64Url.RandomToken(16);
		}
		string s = Canonical(method, path, timestamp, nonce, body);
		byte[] array = key.SignData(Encoding.UTF8.GetBytes(s));
		if (array.Length != 64)
		{
			throw new CryptographicException("Assinatura não está em P1363 (64 bytes)");
		}
		return new SignedHeaders(timestamp.ToString(CultureInfo.InvariantCulture), nonce, Base64Url.Encode(array));
	}

	public static bool Verify(PublicJwk jwk, string canonical, string signatureB64Url)
	{
		byte[] array;
		try
		{
			array = Base64Url.Decode(signatureB64Url);
		}
		catch (FormatException)
		{
			return false;
		}
		if (array.Length != 64)
		{
			return false;
		}
		using ECDsa eCDsa = ECDsa.Create(new ECParameters
		{
			Curve = ECCurve.NamedCurves.nistP256,
			Q = new ECPoint
			{
				X = Base64Url.Decode(jwk.X),
				Y = Base64Url.Decode(jwk.Y)
			}
		});
		return eCDsa.VerifyData(Encoding.UTF8.GetBytes(canonical), array, HashAlgorithmName.SHA256, DSASignatureFormat.IeeeP1363FixedFieldConcatenation);
	}
}
