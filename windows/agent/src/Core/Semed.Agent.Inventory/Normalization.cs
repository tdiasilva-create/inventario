using System;
using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Text.RegularExpressions.Generated;

namespace Semed.Agent.Inventory;

public static class Normalization
{
	private static readonly HashSet<string> GenericValues = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
	{
		"to be filled by o.e.m.", "to be filled by oem", "to be filled by o.e.m", "default string", "default", "system serial number", "system product name", "system manufacturer", "system version", "base board serial number",
		"baseboard serial number", "chassis serial number", "chassis manufacture", "not applicable", "not specified", "not available", "n/a", "na", "none", "null",
		"unknown", "invalid", "oem", "o.e.m.", "serial", "serial number", "0123456789", "123456789", "1234567890", "01234567890",
		"type2 - board serial number", "empty", "no asset tag", "asset-1234567890", "03000200-0400-0500-0006-000700080009", "00020003-0004-0005-0006-000700080009"
	};
	[GeneratedCode("System.Text.RegularExpressions.Generator", "10.0.15.2326")]
	private static Regex SameCharRegex()
	{
		return _003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__SameCharRegex_1.Instance;
	}
	[GeneratedCode("System.Text.RegularExpressions.Generator", "10.0.15.2326")]
	private static Regex ZerosOrFRegex()
	{
		return _003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__ZerosOrFRegex_2.Instance;
	}

	public static Identifier Identifier(string? raw)
	{
		if (raw == null)
		{
			return new Identifier(null, "absent");
		}
		string text = CleanString(raw);
		if (text == null)
		{
			return new Identifier(null, "absent");
		}
		if (GenericValues.Contains(text) || SameCharRegex().IsMatch(text.Replace(" ", "")) || ZerosOrFRegex().IsMatch(text))
		{
			return new Identifier(text, "generic");
		}
		return new Identifier(text, "ok");
	}

	public static string? CleanString(string? raw, int max = 128)
	{
		if (raw == null)
		{
			return null;
		}
		StringBuilder stringBuilder = new StringBuilder(raw.Length);
		foreach (char c in raw)
		{
			if (!char.IsControl(c))
			{
				stringBuilder.Append(c);
			}
		}
		string text = stringBuilder.ToString().Trim();
		while (text.Contains("  ", StringComparison.Ordinal))
		{
			text = text.Replace("  ", " ", StringComparison.Ordinal);
		}
		if (text.Length == 0)
		{
			return null;
		}
		if (text.Length <= max)
		{
			return text;
		}
		return text.Substring(0, max);
	}

	public static string? Mac(string? raw)
	{
		if (string.IsNullOrWhiteSpace(raw))
		{
			return null;
		}
		string hex = new string(raw.Where(Uri.IsHexDigit).ToArray()).ToUpperInvariant();
		if (hex.Length != 12)
		{
			return null;
		}
		return string.Join(':', from i in Enumerable.Range(0, 6)
			select hex.Substring(i * 2, 2));
	}

	public static string ChassisKind(IEnumerable<int>? types)
	{
		if (types == null)
		{
			return "unknown";
		}
		foreach (int type in types)
		{
			switch (type)
			{
			case 3:
			case 4:
			case 5:
			case 6:
			case 7:
			case 15:
			case 16:
			case 24:
				return "desktop";
			case 8:
			case 9:
			case 10:
			case 12:
			case 14:
			case 18:
			case 21:
			case 31:
			case 32:
				return "laptop";
			case 13:
				return "all_in_one";
			case 35:
			case 36:
				return "mini";
			case 17:
			case 23:
			case 28:
				return "server";
			case 30:
				return "tablet";
			}
		}
		return "other";
	}

	public static string? SerialHint(Identifier serial)
	{
		if (serial.Reliability != "ok" || string.IsNullOrEmpty(serial.Value))
		{
			return null;
		}
		string value = serial.Value;
		string text;
		if (value.Length > 4)
		{
			int length = value.Length;
			int num = length - 4;
			text = value.Substring(num, length - num);
		}
		else
		{
			text = value;
		}
		return "••••" + text;
	}
}
