namespace Semed.Agent.Crypto;

public sealed record SignedHeaders(string Timestamp, string Nonce, string Signature);
