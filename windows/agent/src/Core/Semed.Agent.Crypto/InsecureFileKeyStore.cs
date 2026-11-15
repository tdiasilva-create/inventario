using System;
using System.IO;
using System.Security.Cryptography;
using Semed.Agent.Util;

namespace Semed.Agent.Crypto;

public sealed class InsecureFileKeyStore : IKeyStore
{
	private readonly string _dir;

	public InsecureFileKeyStore(string dir, bool developmentOnlyAcknowledged)
	{
		if (!developmentOnlyAcknowledged)
		{
			throw new InvalidOperationException("InsecureFileKeyStore exige confirmação explícita de uso em desenvolvimento.");
		}
		_dir = dir;
		Directory.CreateDirectory(dir);
	}

	private string PathFor(string name)
	{
		return Path.Combine(_dir, name + ".dev-key.p8");
	}

	public ISigningKey? Open(string keyName)
	{
		string path = PathFor(keyName);
		if (!File.Exists(path))
		{
			return null;
		}
		ECDsa eCDsa = ECDsa.Create();
		eCDsa.ImportPkcs8PrivateKey(File.ReadAllBytes(path), out var _);
		return new EcdsaSigningKey(eCDsa);
	}

	public ISigningKey Create(string keyName)
	{
		ECDsa eCDsa = ECDsa.Create(ECCurve.NamedCurves.nistP256);
		AtomicFile.WriteAllBytes(PathFor(keyName), eCDsa.ExportPkcs8PrivateKey());
		return new EcdsaSigningKey(eCDsa);
	}

	public void Delete(string keyName)
	{
		string path = PathFor(keyName);
		if (File.Exists(path))
		{
			File.Delete(path);
		}
	}

	public string Describe()
	{
		return "arquivo-desenvolvimento (INSEGURO)";
	}
}
