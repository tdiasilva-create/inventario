namespace Semed.Agent.Crypto;

public interface IKeyStore
{
	ISigningKey? Open(string keyName);

	ISigningKey Create(string keyName);

	void Delete(string keyName);

	string Describe();
}
