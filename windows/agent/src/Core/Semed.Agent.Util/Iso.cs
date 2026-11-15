using System;
using System.Globalization;

namespace Semed.Agent.Util;

public static class Iso
{
	public static string Format(DateTimeOffset t)
	{
		return t.UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture);
	}

	public static string FormatLocalDisplay(string? iso, TimeZoneInfo? zone = null)
	{
		DateTimeOffset? dateTimeOffset = TryParse(iso);
		if (!dateTimeOffset.HasValue)
		{
			return "—";
		}
		return TimeZoneInfo.ConvertTime(dateTimeOffset.Value, zone ?? TimeZoneInfo.Local).ToString("dd'/'MM'/'yyyy HH':'mm", CultureInfo.InvariantCulture);
	}

	public static DateTimeOffset? TryParse(string? s)
	{
		if (!DateTimeOffset.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var result))
		{
			return null;
		}
		return result;
	}
}
