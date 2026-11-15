namespace Semed.Agent.Protocol;

public sealed class JwkDto
{
	public string Kty { get; set; } = "EC";

	public string Crv { get; set; } = "P-256";

	public string X { get; set; } = "";

	public string Y { get; set; } = "";
}
