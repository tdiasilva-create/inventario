using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Semed.Agent.Protocol;

namespace Semed.Agent.Inventory;

public static class ContentHash
{
	public sealed record Result(string ContentHash, Dictionary<string, string> SectionHashes);

	private static readonly Dictionary<string, string[]> DynamicFields = new Dictionary<string, string[]>
	{
		["storage"] = new string[1] { "free_bytes" },
		["os"] = new string[1] { "last_boot_at" },
		["network"] = new string[6] { "status", "ipv4", "ipv6", "gateways", "dns_servers", "dhcp_enabled" },
		["accounts"] = new string[3] { "interactive_session_count", "console_session_count", "remote_session_count" }
	};

	public static Result Compute(IReadOnlyDictionary<string, Section> sections)
	{
		Dictionary<string, string> dictionary = new Dictionary<string, string>(StringComparer.Ordinal);
		StringBuilder stringBuilder = new StringBuilder();
		foreach (string item in sections.Keys.OrderBy((string k) => k, StringComparer.Ordinal))
		{
			Section section = sections[item];
			JsonNode jsonNode = ((section.Data == null) ? null : JsonSerializer.SerializeToNode(section.Data, section.Data.GetType(), AgentJson.Options));
			if (jsonNode != null && DynamicFields.TryGetValue(item, out string[] value))
			{
				Strip(jsonNode, value);
			}
			string value2 = (dictionary[item] = Hex((jsonNode == null) ? "null" : Canonicalize(jsonNode)));
			stringBuilder.Append(item).Append(':').Append(section.Quality)
				.Append(':')
				.Append(value2)
				.Append('\n');
		}
		return new Result(Hex(stringBuilder.ToString()), dictionary);
	}

	private static string Hex(string s)
	{
		return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(s)));
	}

	private static void Strip(JsonNode node, string[] fields)
	{
		if (!(node is JsonObject jsonObject))
		{
			if (!(node is JsonArray jsonArray))
			{
				return;
			}
			{
				foreach (JsonNode item in jsonArray)
				{
					if (item != null)
					{
						Strip(item, fields);
					}
				}
				return;
			}
		}
		foreach (string propertyName in fields)
		{
			jsonObject.Remove(propertyName);
		}
		foreach (KeyValuePair<string, JsonNode> item2 in jsonObject.ToList())
		{
			if (item2.Value != null)
			{
				Strip(item2.Value, fields);
			}
		}
	}

	public static string Canonicalize(JsonNode? node)
	{
		if (node != null)
		{
			if (!(node is JsonObject source))
			{
				if (node is JsonArray source2)
				{
					return "[" + string.Join(",", source2.Select(Canonicalize).OrderBy((string x) => x, StringComparer.Ordinal)) + "]";
				}
				return node.ToJsonString();
			}
			return "{" + string.Join(",", from kv in source.OrderBy((KeyValuePair<string, JsonNode> kv) => kv.Key, StringComparer.Ordinal)
				select JsonSerializer.Serialize(kv.Key) + ":" + Canonicalize(kv.Value)) + "}";
		}
		return "null";
	}

	public static IReadOnlyList<string> SuspectedHardwareChanges(IReadOnlyDictionary<string, string> previousHashes, IReadOnlyDictionary<string, string> previousQuality, IReadOnlyDictionary<string, string> currentHashes, IReadOnlyDictionary<string, string> currentQuality)
	{
		string[] array = new string[5] { "system", "cpu", "memory", "storage", "gpu" };
		List<string> list = new List<string>();
		string[] array2 = array;
		foreach (string text in array2)
		{
			if (previousHashes.TryGetValue(text, out string value) && currentHashes.TryGetValue(text, out string value2) && !(previousQuality.GetValueOrDefault(text) != "ok") && !(currentQuality.GetValueOrDefault(text) != "ok") && value != value2)
			{
				list.Add(text);
			}
		}
		return list;
	}
}
