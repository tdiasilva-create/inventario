using System;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Semed.Agent.Protocol;

public static class AgentJson
{
	public const string ProtocolVersion = "1.0";

	public static readonly JsonSerializerOptions Options = new JsonSerializerOptions
	{
		PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
		DictionaryKeyPolicy = null,
		DefaultIgnoreCondition = JsonIgnoreCondition.Never,
		WriteIndented = false,
		Encoder = JavaScriptEncoder.Default,
		NumberHandling = JsonNumberHandling.Strict,
		PropertyNameCaseInsensitive = false
	};

	public static readonly JsonSerializerOptions Indented = new JsonSerializerOptions(Options)
	{
		WriteIndented = true
	};

	public static byte[] SerializeToUtf8(object value)
	{
		return JsonSerializer.SerializeToUtf8Bytes(value, value.GetType(), Options);
	}

	public static T? Deserialize<T>(ReadOnlySpan<byte> utf8)
	{
		return JsonSerializer.Deserialize<T>(utf8, Options);
	}
}
